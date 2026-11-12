import { sql } from "./neon.js";
import { cifrar, decifrar } from "./cripto.js";

/* BIBLIOTECA E CONFIGURAÇÕES DA AURA
   - Itens (estudo | prova | material) por usuário, com título e conteúdo cifrados.
   - Configurações de resposta (tom, nível, tamanho, instruções próprias), cifradas.
   - Anexos: limpeza do texto que vai junto da pergunta (extraído no navegador ou de PDF). */

export const TIPOS = ["estudo", "prova", "material"];

export const LIMITES = {
  itensPorUsuario: 200,
  charsTitulo: 120,
  charsConteudo: 30000,
  charsInstrucoes: 300,
  anexosPorMensagem: 3,
  charsNomeAnexo: 120,
  charsTotalAnexos: 15000,
  pdfBytes: 3 * 1024 * 1024,
  charsPdf: 20000,
};

export const OPCOES_CONFIG = {
  tom: ["equilibrado", "formal", "descontraido"],
  nivel: ["simples", "intermediario", "avancado"],
  tamanho: ["curta", "media", "detalhada"],
};

export const CONFIG_PADRAO = {
  tom: "equilibrado",
  nivel: "intermediario",
  tamanho: "media",
  instrucoes: "",
};

const ctx = (uid, campo) => `aura_itens.${campo}:${uid}`;
const ctxConfig = (uid) => `aura_config.dados:${uid}`;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ErroDados extends Error {
  constructor(status, codigo, mensagem) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
  }
}

/* ---------- validação ---------- */

const limparLinhaUnica = (t, max) =>
  typeof t === "string" ? t.replace(/\s+/g, " ").trim().slice(0, max) : "";

export function validarItem({ tipo, titulo, conteudo }) {
  if (!TIPOS.includes(tipo)) throw new ErroDados(400, "TIPO_INVALIDO", "Tipo de item inválido.");

  const t = limparLinhaUnica(titulo, LIMITES.charsTitulo);
  if (!t) throw new ErroDados(400, "TITULO_VAZIO", "Dê um título ao item.");

  const c = typeof conteudo === "string" ? conteudo.replace(/\r\n/g, "\n").trim() : "";
  if (!c) throw new ErroDados(400, "CONTEUDO_VAZIO", "O conteúdo não pode ser vazio.");
  if (c.length > LIMITES.charsConteudo) {
    throw new ErroDados(413, "CONTEUDO_GRANDE", "O conteúdo é grande demais para salvar.");
  }

  return { tipo, titulo: t, conteudo: c };
}

export function validarId(id) {
  if (typeof id !== "string" || !UUID.test(id)) {
    throw new ErroDados(400, "ID_INVALIDO", "Identificador inválido.");
  }
  return id.toLowerCase();
}

export function limparConfig(entrada) {
  const e = entrada && typeof entrada === "object" ? entrada : {};
  const saida = { ...CONFIG_PADRAO };

  for (const campo of Object.keys(OPCOES_CONFIG)) {
    if (OPCOES_CONFIG[campo].includes(e[campo])) saida[campo] = e[campo];
  }

  saida.instrucoes = limparLinhaUnica(e.instrucoes, LIMITES.charsInstrucoes);
  return saida;
}

/** Lê o corpo "anexos" do chat: só texto, poucos, curtos. Nunca lança. */
export function limparAnexos(lista) {
  if (!Array.isArray(lista)) return [];

  const saida = [];
  let total = 0;

  for (const bruto of lista.slice(0, 20)) {
    if (saida.length >= LIMITES.anexosPorMensagem) break;
    if (!bruto || typeof bruto !== "object") continue;

    const nome = limparLinhaUnica(bruto.nome, LIMITES.charsNomeAnexo) || "arquivo";
    let texto = typeof bruto.texto === "string" ? bruto.texto.replace(/\u0000/g, "").trim() : "";
    if (!texto) continue;

    const sobra = LIMITES.charsTotalAnexos - total;
    if (sobra <= 0) break;

    let cortado = false;
    if (texto.length > sobra) {
      texto = texto.slice(0, sobra);
      cortado = true;
    }

    total += texto.length;
    saida.push({ nome, texto, cortado });
  }

  return saida;
}

/* ---------- itens ---------- */

function abrirItem(uid, linha, { comConteudo }) {
  const item = {
    id: linha.id,
    tipo: linha.tipo,
    titulo: "",
    criadoEm: linha.criado_em,
    atualizadoEm: linha.atualizado_em,
  };

  try {
    item.titulo = decifrar(linha.titulo, ctx(uid, "titulo")) || "";
    if (comConteudo) item.conteudo = decifrar(linha.conteudo, ctx(uid, "conteudo")) || "";
  } catch (erro) {
    console.error("[AURA-DADOS] Item ilegível:", erro?.message);
    return null;
  }

  return item;
}

export async function listarItens(uid, tipo) {
  if (!TIPOS.includes(tipo)) throw new ErroDados(400, "TIPO_INVALIDO", "Tipo de item inválido.");

  const linhas = await sql`
    SELECT id, tipo, titulo, conteudo, criado_em, atualizado_em
      FROM aura_itens
     WHERE uid = ${uid} AND tipo = ${tipo}
     ORDER BY criado_em DESC
     LIMIT ${LIMITES.itensPorUsuario}
  `;

  return linhas.map((l) => abrirItem(uid, l, { comConteudo: true })).filter(Boolean);
}

export async function criarItem(uid, entrada) {
  const { tipo, titulo, conteudo } = validarItem(entrada);

  const [{ total }] = await sql`SELECT count(*)::int AS total FROM aura_itens WHERE uid = ${uid}`;
  if (total >= LIMITES.itensPorUsuario) {
    throw new ErroDados(409, "LIMITE_ITENS", "Você atingiu o limite de itens salvos. Exclua algum para salvar outro.");
  }

  const [linha] = await sql`
    INSERT INTO aura_itens (uid, tipo, titulo, conteudo)
    SELECT firebase_uid, ${tipo}, ${cifrar(titulo, ctx(uid, "titulo"))}, ${cifrar(conteudo, ctx(uid, "conteudo"))}
      FROM users WHERE firebase_uid = ${uid}
    RETURNING id, tipo, titulo, conteudo, criado_em, atualizado_em
  `;

  if (!linha) throw new ErroDados(404, "USUARIO_NAO_ENCONTRADO", "Conta não encontrada na plataforma.");
  return abrirItem(uid, linha, { comConteudo: true });
}

export async function atualizarItem(uid, id, { titulo, conteudo }) {
  const idOk = validarId(id);
  const [atual] = await sql`SELECT tipo FROM aura_itens WHERE id = ${idOk} AND uid = ${uid}`;
  if (!atual) throw new ErroDados(404, "ITEM_NAO_ENCONTRADO", "Item não encontrado.");

  const v = validarItem({ tipo: atual.tipo, titulo, conteudo });

  const [linha] = await sql`
    UPDATE aura_itens
       SET titulo = ${cifrar(v.titulo, ctx(uid, "titulo"))},
           conteudo = ${cifrar(v.conteudo, ctx(uid, "conteudo"))},
           atualizado_em = now()
     WHERE id = ${idOk} AND uid = ${uid}
    RETURNING id, tipo, titulo, conteudo, criado_em, atualizado_em
  `;

  if (!linha) throw new ErroDados(404, "ITEM_NAO_ENCONTRADO", "Item não encontrado.");
  return abrirItem(uid, linha, { comConteudo: true });
}

export async function excluirItem(uid, id) {
  const idOk = validarId(id);
  const apagados = await sql`DELETE FROM aura_itens WHERE id = ${idOk} AND uid = ${uid} RETURNING id`;
  if (apagados.length === 0) throw new ErroDados(404, "ITEM_NAO_ENCONTRADO", "Item não encontrado.");
}

/* ---------- configurações ---------- */

export async function lerConfig(uid) {
  const [linha] = await sql`SELECT dados FROM aura_config WHERE uid = ${uid}`;
  if (!linha?.dados) return { ...CONFIG_PADRAO };

  try {
    return limparConfig(JSON.parse(decifrar(linha.dados, ctxConfig(uid))));
  } catch (erro) {
    console.error("[AURA-DADOS] Config ilegível:", erro?.message);
    return { ...CONFIG_PADRAO };
  }
}

export async function salvarConfig(uid, entrada) {
  const config = limparConfig(entrada);

  const gravado = await sql`
    INSERT INTO aura_config (uid, dados)
    SELECT firebase_uid, ${cifrar(JSON.stringify(config), ctxConfig(uid))}
      FROM users WHERE firebase_uid = ${uid}
    ON CONFLICT (uid) DO UPDATE SET dados = EXCLUDED.dados, atualizado_em = now()
    RETURNING uid
  `;

  if (gravado.length === 0) throw new ErroDados(404, "USUARIO_NAO_ENCONTRADO", "Conta não encontrada na plataforma.");
  return config;
}

/** Para o chat: nunca lança; sem config salva devolve null (nada a adicionar ao prompt). */
export async function lerConfigParaPrompt(uid, { timeoutMs = 3000 } = {}) {
  let timer;
  const limite = new Promise((_, rejeitar) => {
    timer = setTimeout(() => rejeitar(new Error("Tempo esgotado ao ler configurações.")), timeoutMs);
  });

  try {
    const config = await Promise.race([lerConfig(uid), limite]);
    const igualAoPadrao = Object.keys(CONFIG_PADRAO).every((k) => config[k] === CONFIG_PADRAO[k]);
    return igualAoPadrao ? null : config;
  } finally {
    clearTimeout(timer);
  }
}

/* ---------- PDF ---------- */

export async function extrairTextoPdf(base64) {
  if (typeof base64 !== "string" || !base64) throw new ErroDados(400, "PDF_VAZIO", "Arquivo vazio.");

  const buffer = Buffer.from(base64, "base64");
  if (buffer.length === 0) throw new ErroDados(400, "PDF_VAZIO", "Arquivo vazio.");
  if (buffer.length > LIMITES.pdfBytes) {
    throw new ErroDados(413, "PDF_GRANDE", "O PDF passa de 3 MB.");
  }
  if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
    throw new ErroDados(415, "PDF_INVALIDO", "O arquivo não é um PDF válido.");
  }

  let extrair;
  try {
    // Import dinâmico: se a biblioteca falhar, só o PDF é afetado (o chat continua).
    const modulo = await import("pdf-parse/lib/pdf-parse.js");
    extrair = modulo.default || modulo;
  } catch (erro) {
    console.error("[AURA-DADOS] pdf-parse indisponível:", erro?.message);
    throw new ErroDados(503, "PDF_INDISPONIVEL", "A leitura de PDF está indisponível agora.");
  }

  let resultado;
  try {
    resultado = await extrair(buffer);
  } catch (erro) {
    console.error("[AURA-DADOS] Falha ao ler PDF:", erro?.message);
    throw new ErroDados(422, "PDF_ILEGIVEL", "Não consegui ler este PDF (protegido ou corrompido).");
  }

  const texto = String(resultado?.text || "").replace(/\u0000/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (!texto) {
    throw new ErroDados(422, "PDF_SEM_TEXTO", "Este PDF não tem texto selecionável (parece digitalizado).");
  }

  return { texto: texto.slice(0, LIMITES.charsPdf), cortado: texto.length > LIMITES.charsPdf };
}
