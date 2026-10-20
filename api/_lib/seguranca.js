import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { sql } from "./neon.js";
import { avaliarPapel, normalizarPapel, papelPermitido } from "./papel.js";
import { cifrar, decifrar, garantirCifrado, indiceCego } from "./cripto.js";
import { configurarCors, origemAutorizada } from "./origem.js";

/* SEGURANÇA DO SERVIDOR
   Camada 1 (plataforma): o Neon é a fonte da verdade do papel.
   Camada 2 (AURA/Firebase): o papel é espelhado como custom claim, definido SÓ por este servidor.
   E-mail verificado é obrigatório; o papel é escolhido uma vez e nunca muda; dados pessoais
   vão cifrados para o Neon; origens de outros sites são recusadas. */

if (!getApps().length) {
  const chave = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!chave) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY não está configurada.");
  let conta;
  try {
    conta = JSON.parse(chave);
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY possui JSON inválido.");
  }
  initializeApp({ credential: cert(conta) });
}

const adminAuth = getAuth();

export class ErroApi extends Error {
  constructor(status, codigo, mensagem, extra = {}) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
    this.extra = extra;
  }
}

export { configurarCors };

export function verificarOrigem(req) {
  if (!origemAutorizada(req)) {
    throw new ErroApi(403, "ORIGIN_NOT_ALLOWED", "Origem não autorizada.");
  }
}

export function responderErro(res, erro) {
  if (erro instanceof ErroApi) {
    return res.status(erro.status).json({
      sucesso: false,
      erro: erro.message,
      codigo: erro.codigo,
      ...erro.extra,
    });
  }
  console.error("[SEGURANCA] Erro inesperado:", erro?.message || erro);
  return res.status(500).json({ sucesso: false, erro: "Erro interno.", codigo: "INTERNAL_ERROR" });
}

/* ---------- autenticação (Firebase ID Token) ---------- */

export async function autenticar(req, { exigirEmailVerificado = true } = {}) {
  const cab = req.headers.authorization || "";
  if (!cab.startsWith("Bearer ")) {
    throw new ErroApi(401, "AUTH_REQUIRED", "Autenticação necessária.");
  }
  const token = cab.slice(7).trim();
  if (!token) throw new ErroApi(401, "AUTH_REQUIRED", "Autenticação necessária.");

  let decoded;
  try {
    // checkRevoked: sessão revogada no Firebase deixa de valer na hora.
    decoded = await adminAuth.verifyIdToken(token, true);
  } catch {
    throw new ErroApi(401, "AUTH_INVALID", "Token inválido ou expirado.");
  }

  if (exigirEmailVerificado && decoded.email_verified !== true) {
    throw new ErroApi(403, "EMAIL_NOT_VERIFIED", "Confirme seu e-mail para continuar.");
  }
  return decoded;
}

/* ---------- usuário na plataforma (Neon, dados cifrados) ---------- */

const CTX = { email: "users.email", nome: "users.display_name", foto: "users.photo_url" };

const limitar = (v, n) => (typeof v === "string" ? v.trim().slice(0, n) : "");

export function abrirUsuario(linha) {
  return {
    ...linha,
    email: decifrar(linha.email, CTX.email),
    display_name: decifrar(linha.display_name, CTX.nome),
    photo_url: decifrar(linha.photo_url, CTX.foto),
  };
}

export async function obterOuCriarUsuario(decoded) {
  const uid = decoded.uid;
  const email = limitar(decoded.email, 320);
  const nome = limitar(decoded.name, 150);
  const foto = limitar(decoded.picture, 1000);

  const achados = await sql`
    SELECT id, status, email, display_name, photo_url, email_hash
    FROM users WHERE firebase_uid = ${uid} LIMIT 1`;

  if (achados.length) {
    const u = achados[0];
    if (u.status !== "active") {
      throw new ErroApi(403, "ACCOUNT_NOT_ACTIVE", "Esta conta não está ativa.");
    }

    // Dado novo é cifrado; dado antigo em texto puro é cifrado agora (migração gradual).
    const emailCif = email ? cifrar(email, CTX.email) : garantirCifrado(u.email, CTX.email);
    const nomeCif = nome ? cifrar(nome, CTX.nome) : garantirCifrado(u.display_name, CTX.nome);
    const fotoCif = foto ? cifrar(foto, CTX.foto) : garantirCifrado(u.photo_url, CTX.foto);
    const hash = email ? indiceCego(email) : u.email_hash;

    const r = await sql`
      UPDATE users SET
        email = ${emailCif},
        display_name = ${nomeCif},
        photo_url = ${fotoCif},
        email_hash = ${hash},
        last_login_at = NOW(), updated_at = NOW()
      WHERE id = ${u.id}
      RETURNING id, firebase_uid, email, display_name, photo_url, status, role,
                created_at, updated_at, last_login_at`;
    return abrirUsuario(r[0]);
  }

  let r;
  try {
    r = await sql`
      INSERT INTO users (firebase_uid, email, display_name, photo_url, email_hash, status, last_login_at)
      VALUES (
        ${uid},
        ${email ? cifrar(email, CTX.email) : null},
        ${nome ? cifrar(nome, CTX.nome) : null},
        ${foto ? cifrar(foto, CTX.foto) : null},
        ${indiceCego(email)},
        'active', NOW()
      )
      RETURNING id, firebase_uid, email, display_name, photo_url, status, role,
                created_at, updated_at, last_login_at`;
  } catch (erro) {
    // Índice único em email_hash: este e-mail já pertence a outra conta (e a um papel definitivo).
    if (erro?.code === "23505") {
      throw new ErroApi(409, "EMAIL_ALREADY_LINKED", "Este e-mail já está vinculado a outra conta da plataforma.");
    }
    throw erro;
  }
  return abrirUsuario(r[0]);
}

/* ---------- papel: escolhido uma vez, nunca trocado ---------- */

const negarPapel = (papelReal) =>
  new ErroApi(
    403,
    "ROLE_MISMATCH",
    papelReal
      ? `Esta conta é de ${papelReal === "professor" ? "Professor" : "Aluno"} e não pode acessar a outra área.`
      : "O papel desta conta já foi definido e não pode ser alterado.",
    { papelReal: papelReal ?? null },
  );

export async function aplicarPapel(usuario, decoded, papelSolicitado) {
  // O papel escolhido no cadastro (claim `papelPendente`, gravado pelo servidor) vale até ir ao Neon.
  const atual = normalizarPapel(usuario.role) ?? normalizarPapel(decoded.papelPendente);
  const decisao = avaliarPapel(atual, papelSolicitado);

  if (decisao.acao === "negar") throw negarPapel(decisao.papel);

  const papel = decisao.papel;

  if (papel && !normalizarPapel(usuario.role)) {
    // Atômico: só grava se ainda não houver papel (protege contra duas abas/requisições).
    const r = await sql`
      UPDATE users SET role = ${papel}, role_set_at = NOW(), updated_at = NOW()
      WHERE id = ${usuario.id} AND role IS NULL
      RETURNING role`;

    if (!r.length) {
      const reler = await sql`SELECT role FROM users WHERE id = ${usuario.id} LIMIT 1`;
      const real = normalizarPapel(reler[0]?.role);
      if (real !== papel) throw negarPapel(real);
    }
  }

  if (papel && (decoded.role !== papel || decoded.papelPendente)) {
    const registro = await adminAuth.getUser(decoded.uid);
    const claims = { ...(registro.customClaims || {}), role: papel };
    delete claims.papelPendente;
    await adminAuth.setCustomUserClaims(decoded.uid, claims);
  }

  return papel;
}

/** No CADASTRO (antes da verificação do e-mail): o servidor registra o papel escolhido. */
export async function definirPapelPendente(decoded, papelSolicitado) {
  const pedido = normalizarPapel(papelSolicitado);
  if (!pedido) throw new ErroApi(400, "ROLE_INVALID", "Escolha Aluno ou Professor.");

  // Procura pelo uid E pelo e-mail: o mesmo e-mail nunca assume dois papéis,
  // mesmo que a conta do Firebase seja apagada e recriada.
  const hash = indiceCego(decoded.email);
  const r = await sql`
    SELECT role FROM users
    WHERE firebase_uid = ${decoded.uid}
       OR (${hash}::text IS NOT NULL AND email_hash = ${hash})
    ORDER BY (firebase_uid = ${decoded.uid}) DESC
    LIMIT 1`;
  const registro = await adminAuth.getUser(decoded.uid);
  const claims = registro.customClaims || {};

  const atual =
    normalizarPapel(r[0]?.role) ?? normalizarPapel(claims.role) ?? normalizarPapel(claims.papelPendente);

  const decisao = avaliarPapel(atual, pedido);
  if (decisao.acao === "negar") throw negarPapel(decisao.papel);

  if (decisao.acao === "definir") {
    await adminAuth.setCustomUserClaims(decoded.uid, { ...claims, papelPendente: pedido });
  }
  return decisao.papel;
}

/* ---------- guarda para os endpoints da plataforma ---------- */

/**  const { usuario } = await exigirPapel(req, "professor");
 *   const { usuario } = await exigirPapeis(req, ["aluno", "professor"]);
 * Exige origem autorizada, e-mail verificado e consulta o Neon (fonte da verdade). */
export async function exigirPapeis(req, papeisPermitidos) {
  verificarOrigem(req);
  const decoded = await autenticar(req);

  const r = await sql`SELECT id, status, role FROM users WHERE firebase_uid = ${decoded.uid} LIMIT 1`;
  const usuario = r[0];

  if (!usuario) throw new ErroApi(403, "USER_NOT_FOUND", "Conta não encontrada na plataforma.");
  if (usuario.status !== "active") {
    throw new ErroApi(403, "ACCOUNT_NOT_ACTIVE", "Esta conta não está ativa.");
  }
  if (!papeisPermitidos.some((p) => papelPermitido(usuario.role, p))) {
    throw new ErroApi(403, "FORBIDDEN_ROLE", "Você não tem permissão para esta área.");
  }
  return { decoded, usuario };
}

export const exigirPapel = (req, papelExigido) => exigirPapeis(req, [papelExigido]);
