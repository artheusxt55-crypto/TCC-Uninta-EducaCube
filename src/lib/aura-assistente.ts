/* Assistente de criação da AURA: quando o usuário pede para CRIAR uma prova, plano de aula ou
   material, abre-se uma tela com perguntas (uma por vez) e, no fim, o pedido completo é enviado.
   Tudo aqui é lógica pura (sem React) para ser testada.
   As perguntas do modelo (bloco aura-perguntas) usam a mesma tela. */

import type { PerguntaAura } from "./aura-perguntas";

export type TipoCriacao = "prova" | "plano" | "material";

export interface PassoAssistente {
  id: string;
  pergunta: string;
  dica?: string;
  opcoes: string[];
  /** Permite escrever a própria resposta. */
  livre: boolean;
  /** Se for só texto (sem opções), o campo livre é a própria resposta. */
  obrigatoria: boolean;
}

export interface Criacao {
  tipo: TipoCriacao;
  /** Respostas já deduzidas do pedido (id do passo → resposta). */
  previas: Record<string, string>;
}

const VERBO = "(?:cri[ae]r?|crie|fa[cç]a|fazer|ger[ae]r?|gere|mont[ae]r?|monte|elabor[ae]r?|elabore|prepar[ae]r?|prepare|produz[ai]r?|escrev[ae]r?|me\\s+d[eê])";

const TIPOS: { tipo: TipoCriacao; regex: RegExp }[] = [
  { tipo: "plano", regex: /plano\s+de\s+aula|sequ[eê]ncia\s+did[aá]tica|roteiro\s+de\s+aula/i },
  { tipo: "prova", regex: /prova|avalia[cç][aã]o|simulado|lista\s+de\s+exerc[ií]cios|exerc[ií]cios|quest[oõ]es|question[aá]rio|atividade\s+avaliativa/i },
  { tipo: "material", regex: /apostila|material\s+(?:did[aá]tico|de\s+apoio|de\s+estudo)|resumo|mapa\s+mental|texto\s+de\s+apoio|slides?/i },
];

const NIVEIS: [RegExp, string][] = [
  [/\b[1-5][ºo°]\s*ano\b.*\bfundamental|\bfundamental\s*(?:i\b|1\b)|anos\s+iniciais/i, "Ensino Fundamental (anos iniciais)"],
  [/\b[6-9][ºo°]\s*ano\b|\bfundamental\s*(?:ii\b|2\b)|anos\s+finais/i, "Ensino Fundamental (anos finais)"],
  [/ensino\s+m[eé]dio|\b[1-3][ºo°]\s*ano\s+do\s+m[eé]dio/i, "Ensino Médio"],
  [/ensino\s+superior|faculdade|gradua[cç][aã]o|universit/i, "Ensino Superior"],
  [/educa[cç][aã]o\s+infantil|creche|pr[eé]-?escola/i, "Educação Infantil"],
];

function limparTema(bruto: string): string {
  return bruto
    .split(/\s+(?:para|pra|com|que|onde|no|na|nos|nas|em|usando|basead[oa])\s+/i)[0]
    .replace(/[.!?]+$/, "")
    .trim()
    .slice(0, 120);
}

/** Detecta pedido de criação. Devolve null para dúvidas, ajustes e pedidos já bem detalhados. */
export function detectarCriacao(texto: string): Criacao | null {
  const t = texto.trim();

  if (t.length < 8 || t.length > 220) return null;
  if (!new RegExp(`\\b${VERBO}\\b`, "i").test(t)) return null;

  const achado = TIPOS.find((x) => x.regex.test(t));
  if (!achado) return null;

  const previas: Record<string, string> = {};

  const aposTipo = t.split(achado.regex).slice(1).join(" ");
  const temaMatch = /\b(?:sobre|acerca\s+de|de|do|da|dos|das)\s+(.{3,})$/i.exec(aposTipo.trim());
  const temaLimpo = temaMatch ? limparTema(temaMatch[1]) : "";

  if (temaLimpo && !/^(?:meus?|minhas?|nossos?|os|as|uns|umas?|alunos?|turma|sala)\b/i.test(temaLimpo)) {
    previas.tema = temaLimpo;
  }

  for (const [regex, nivel] of NIVEIS) {
    if (regex.test(t)) {
      previas.nivel = nivel;
      break;
    }
  }

  const n = /\b(\d{1,2})\s*(?:quest[oõ]es|perguntas|exerc[ií]cios)\b/i.exec(t);
  if (n && achado.tipo === "prova") previas.quantidade = n[1];

  return { tipo: achado.tipo, previas };
}

const NIVEL_OPCOES = [
  "Educação Infantil",
  "Ensino Fundamental (anos iniciais)",
  "Ensino Fundamental (anos finais)",
  "Ensino Médio",
  "Ensino Superior",
];

const TEMA: PassoAssistente = {
  id: "tema",
  pergunta: "Sobre qual tema ou conteúdo?",
  dica: "Ex.: Teorias de Piaget e Vygotsky, frações, Revolução Industrial",
  opcoes: [],
  livre: true,
  obrigatoria: true,
};

const NIVEL: PassoAssistente = {
  id: "nivel",
  pergunta: "Para qual público?",
  dica: "Isso muda a linguagem e a profundidade.",
  opcoes: NIVEL_OPCOES,
  livre: true,
  obrigatoria: true,
};

const EXTRA: PassoAssistente = {
  id: "extra",
  pergunta: "Quer pedir mais alguma coisa?",
  dica: "Opcional: foco em algum tópico, BNCC, estilo ENEM, contexto da turma...",
  opcoes: [],
  livre: true,
  obrigatoria: false,
};

export function passosDe(tipo: TipoCriacao): PassoAssistente[] {
  if (tipo === "prova") {
    return [
      TEMA,
      NIVEL,
      { id: "quantidade", pergunta: "Quantas questões?", opcoes: ["5", "10", "15", "20"], livre: true, obrigatoria: true },
      {
        id: "formato",
        pergunta: "Qual o formato das questões?",
        opcoes: ["Múltipla escolha", "Dissertativas", "Mistas", "Verdadeiro ou falso"],
        livre: false,
        obrigatoria: true,
      },
      {
        id: "dificuldade",
        pergunta: "Qual a dificuldade?",
        opcoes: ["Fácil", "Média", "Difícil", "Variada (do fácil ao difícil)"],
        livre: false,
        obrigatoria: true,
      },
      {
        id: "gabarito",
        pergunta: "Como deve ser o gabarito?",
        dica: "Fica em uma seção separada, e o PDF pode sair só com as questões.",
        opcoes: ["Comentado (explica cada resposta)", "Só as respostas", "Sem gabarito"],
        livre: false,
        obrigatoria: true,
      },
      EXTRA,
    ];
  }

  if (tipo === "plano") {
    return [
      TEMA,
      NIVEL,
      { id: "duracao", pergunta: "Quanto tempo de aula?", opcoes: ["50 minutos", "100 minutos (aula dupla)", "Uma semana", "Um mês"], livre: true, obrigatoria: true },
      {
        id: "metodologia",
        pergunta: "Qual abordagem prefere?",
        opcoes: ["Aula expositiva dialogada", "Metodologias ativas", "Atividade em grupo", "Você sugere"],
        livre: false,
        obrigatoria: true,
      },
      {
        id: "avaliacao",
        pergunta: "Incluir como avaliar a aprendizagem?",
        opcoes: ["Sim, com critérios", "Sim, uma atividade final", "Não"],
        livre: false,
        obrigatoria: true,
      },
      EXTRA,
    ];
  }

  return [
    TEMA,
    NIVEL,
    {
      id: "formato",
      pergunta: "Que tipo de material?",
      opcoes: ["Resumo", "Texto de apoio", "Mapa mental em tópicos", "Roteiro de slides"],
      livre: true,
      obrigatoria: true,
    },
    { id: "tamanho", pergunta: "Qual o tamanho?", opcoes: ["Curto (1 página)", "Médio (2 a 3 páginas)", "Completo"], livre: false, obrigatoria: true },
    EXTRA,
  ];
}

export const ROTULO_TIPO: Record<TipoCriacao, string> = {
  prova: "prova ou lista de exercícios",
  plano: "plano de aula",
  material: "material de estudo",
};

export function tituloDoAssistente(tipo: TipoCriacao): string {
  return tipo === "prova" ? "Vamos montar sua prova" : tipo === "plano" ? "Vamos montar seu plano de aula" : "Vamos montar seu material";
}

/** Monta o pedido final, completo, para a AURA criar sem perguntar de novo. */
export function montarPedido(tipo: TipoCriacao, r: Record<string, string>): string {
  const g = (k: string) => (r[k] || "").trim();
  const extra = g("extra") ? ` Observações: ${g("extra")}.` : "";

  if (tipo === "prova") {
    const gabarito =
      g("gabarito") === "Sem gabarito"
        ? "Não inclua gabarito."
        : `Coloque o GABARITO (${(g("gabarito") || "comentado").toLowerCase()}) no final, em uma seção separada com o título "## Gabarito".`;

    return (
      `Crie uma prova sobre "${g("tema")}" para ${g("nivel") || "o público indicado"}, com ${g("quantidade") || "10"} questões ` +
      `${(g("formato") || "mistas").toLowerCase()}, de dificuldade ${(g("dificuldade") || "média").toLowerCase()}. ` +
      `Numere as questões. ${gabarito}${extra} Crie agora, sem fazer perguntas.`
    );
  }

  if (tipo === "plano") {
    return (
      `Crie um plano de aula sobre "${g("tema")}" para ${g("nivel") || "o público indicado"}, com duração de ${g("duracao") || "50 minutos"}, ` +
      `usando a abordagem: ${g("metodologia") || "você sugere"}. ` +
      `Inclua objetivos, conteúdo, desenvolvimento passo a passo e recursos. ` +
      `${g("avaliacao") && g("avaliacao") !== "Não" ? `Inclua a avaliação da aprendizagem (${g("avaliacao").toLowerCase()}). ` : ""}` +
      `${extra} Crie agora, sem fazer perguntas.`
    );
  }

  return (
    `Crie um material de estudo do tipo "${g("formato") || "resumo"}" sobre "${g("tema")}" para ${g("nivel") || "o público indicado"}, ` +
    `com tamanho ${(g("tamanho") || "médio").toLowerCase()}. Use títulos e tópicos organizados.${extra} Crie agora, sem fazer perguntas.`
  );
}

/** Passos a partir das perguntas que o próprio modelo fez. */
export function passosDasPerguntas(perguntas: PerguntaAura[]): PassoAssistente[] {
  return perguntas.map((p, i) => ({
    id: `p${i}`,
    pergunta: p.pergunta,
    opcoes: p.opcoes,
    livre: true,
    obrigatoria: p.opcoes.length === 0,
  }));
}

/** Resposta única (texto) a partir das escolhas nas perguntas do modelo. */
export function montarRespostasDoModelo(passos: PassoAssistente[], r: Record<string, string>): string {
  const linhas = passos
    .map((p, i) => ({ p, v: (r[p.id] || "").trim(), i }))
    .filter((x) => x.v)
    .map((x) => `${x.i + 1}. ${x.p.pergunta} ${x.v}`);

  return linhas.length ? linhas.join("\n") : "Pode decidir você, escolha o que for mais adequado.";
}

/** Pedido de criação em qualquer tamanho (diferente de detectarCriacao, que só pega pedidos curtos). */
const DESEJO = "(?:quer(?:o|ia|emos)|precis(?:o|a|amos|aria|ava)|necessito|gostaria|desejo|d[aá]\\s+pra|d[aá]\\s+para|tenho\\s+que\\s+(?:fazer|montar|criar)|preciso\\s+de)";

export function ehPedidoDeCriacao(texto: string): boolean {
  const t = texto.replace(/\n+📎[\s\S]*$/, "");
  if (/^\s*(?:o\s+que|qual|quais|como|por\s+que|porque|quando|onde)\b/i.test(t)) return false;
  if (!new RegExp(`\\b(?:${VERBO}|${DESEJO})\\b`, "i").test(t)) return false;
  return TIPOS.some((x) => x.regex.test(t));
}

/**
 * Recorta o histórico enviado à AURA para não misturar assuntos: a partir do ÚLTIMO pedido de
 * criação (prova, plano, material...) só entra o que veio depois dele (perguntas, respostas, ajustes).
 * Sem pedido de criação, mantém as últimas `limite` mensagens.
 */
export function recortarContextoCriacao<T extends { role: string; content: string }>(mensagens: T[], limite = 8): T[] {
  let inicio = -1;

  for (let i = mensagens.length - 1; i >= 0; i--) {
    if (mensagens[i].role === "user" && ehPedidoDeCriacao(mensagens[i].content)) {
      inicio = i;
      break;
    }
  }

  return (inicio >= 0 ? mensagens.slice(inicio) : mensagens).slice(-limite);
}

/** O usuário pediu um documento/arquivo (inclui pedidos de ajuste vindos do visualizador). */
export function pediuDocumento(texto: string): boolean {
  return ehPedidoDeCriacao(texto) || /\b(pdf|documento|arquivo|material)\b/i.test(texto) || /^Ajuste o documento/i.test(texto.trim());
}

/** Há, entre as mensagens do usuário logo antes da resposta, um pedido de documento? */
export function respostaVeioDePedidoDeDocumento<T extends { role: string; content: string }>(mensagens: T[], indice: number): boolean {
  const antes = mensagens.slice(Math.max(0, indice - 6), indice).filter((m) => m.role === "user");
  return antes.some((m) => pediuDocumento(m.content));
}

/* ---------- entendimento do pedido (tema, série, quantidade...) ---------- */

export interface Entendimento {
  tipo?: TipoCriacao;
  tema?: string;
  nivel?: string;
  quantidade?: string;
  dificuldade?: string;
  gabarito?: string;
  formato?: string;
}

function temaDoTexto(t: string, regexTipo?: RegExp): string {
  const explicito = /\b(?:tema|assunto|conte[uú]do)\s*[:\-]\s*(.{2,})$/im.exec(t);
  if (explicito) return limparTema(explicito[1]);

  const sobre = /\b(?:sobre|acerca\s+de|a\s+respeito\s+de|referente\s+a|envolvendo|que\s+fale\s+de)\s+(.{2,})$/i.exec(t.replace(/\n[\s\S]*$/, ""));
  if (sobre) return limparTema(sobre[1]);

  if (regexTipo) {
    const apos = t.split(regexTipo).slice(1).join(" ").trim();
    const m = /^(?:de|do|da|dos|das)\s+(.{2,})$/i.exec(apos);
    if (m) {
      const tema = limparTema(m[1]);
      if (tema && !/^(?:meus?|minhas?|nossos?|os|as|uns|umas?|alunos?|turma|sala|\d)/i.test(tema) && !/quest[oõ]es|perguntas|exerc[ií]cios\s*$/i.test(tema)) return tema;
    }
  }

  return "";
}

/** Extrai o que o texto do usuário já diz sobre o que quer criar (qualquer tamanho). */
export function entenderTexto(texto: string): Entendimento {
  const t = texto.trim();
  const r: Entendimento = {};

  const achado = TIPOS.find((x) => x.regex.test(t));
  if (achado) r.tipo = achado.tipo;

  const tema = temaDoTexto(t, achado?.regex);
  if (tema) r.tema = tema;

  for (const [regex, nivel] of NIVEIS) {
    if (regex.test(t)) {
      r.nivel = nivel;
      break;
    }
  }

  const n = /\b(\d{1,2})\s*(?:quest[oõ]es|perguntas|exerc[ií]cios)\b/i.exec(t);
  if (n) r.quantidade = n[1];

  if (/\bsem\s+gabarito\b/i.test(t)) r.gabarito = "não";
  else if (/\bcom\s+gabarito\b|\bgabarito\b/i.test(t)) r.gabarito = "sim";

  const dif = /\b(f[aá]cil|f[aá]ceis|m[eé]dia|dif[ií]cil|dif[ií]ceis|desafiador[a]?)\b/i.exec(t);
  if (dif) r.dificuldade = dif[1].toLowerCase();

  if (/m[uú]ltipla\s+escolha/i.test(t)) r.formato = "múltipla escolha";
  else if (/discursiv/i.test(t)) r.formato = "discursivas";
  else if (/verdadeiro\s+ou\s+falso|\bv\s*ou\s*f\b/i.test(t)) r.formato = "verdadeiro ou falso";

  return r;
}

/** Lê respostas no formato "1. Pergunta? Resposta" (tela de perguntas da AURA). */
function entenderRespostas(texto: string): Entendimento {
  const r: Entendimento = {};

  for (const linha of texto.split("\n")) {
    const m = /^\s*\d+\.\s*(.+?\?)\s*(.+)$/.exec(linha);
    if (!m) continue;

    const [, pergunta, resposta] = m;
    const v = resposta.trim();
    if (!v) continue;

    if (/s[eé]rie|n[ií]vel|etapa|turma/i.test(pergunta)) r.nivel = v;
    else if (/quant/i.test(pergunta)) r.quantidade = v.replace(/\D+/g, "") || v;
    else if (/tema|assunto|conte[uú]do|t[oó]pico/i.test(pergunta)) r.tema = v;
    else if (/dificuldade/i.test(pergunta)) r.dificuldade = v;
    else if (/gabarito/i.test(pergunta)) r.gabarito = v;
    else if (/tipo|formato|estilo/i.test(pergunta)) r.formato = v;
  }

  return r;
}

/** Junta o pedido de criação atual com as respostas dadas depois dele. */
export function entenderPedidoAtual<T extends { role: string; content: string }>(mensagens: T[]): Entendimento | null {
  const janela = recortarContextoCriacao(mensagens, 12);
  const usuario = janela.filter((m) => m.role === "user");
  if (!usuario.length || !ehPedidoDeCriacao(usuario[0].content)) return null;

  const base = entenderTexto(usuario[0].content.replace(/\n+📎[\s\S]*$/, ""));

  for (const m of usuario.slice(1)) {
    const lidas = entenderRespostas(m.content);
    Object.assign(base, lidas);

    // Só o tema, em mensagem separada: "Vygotsky".
    const t = m.content.replace(/\n+📎[\s\S]*$/, "").trim();
    if (!base.tema && !Object.keys(lidas).length && t.length >= 2 && t.length <= 120 && !/\n/.test(t) && !/^\d+\./.test(t)) {
      base.tema = limparTema(t.replace(/^(?:o\s+)?(?:tema|assunto)\s*(?:é|e|:)?\s*/i, ""));
    }
  }

  return base;
}

/** Texto curto, enviado junto do prompt, que diz à AURA o que o sistema já entendeu. */
export function descreverEntendimento(e: Entendimento | null, temArquivo: boolean): string {
  if (!e) return "";

  const itens = [
    e.tipo ? `tipo=${e.tipo}` : "",
    e.tema ? `tema="${e.tema}"` : "",
    e.nivel ? `série/nível="${e.nivel}"` : "",
    e.quantidade ? `quantidade=${e.quantidade}` : "",
    e.dificuldade ? `dificuldade=${e.dificuldade}` : "",
    e.formato ? `formato=${e.formato}` : "",
    e.gabarito ? `gabarito=${e.gabarito}` : "",
  ].filter(Boolean);

  return `\n\n[ENTENDIMENTO DO SISTEMA SOBRE ESTE PEDIDO DE CRIAÇÃO — dados tirados do texto do usuário: ${itens.length ? itens.join("; ") : "nenhum dado específico"}${
    temArquivo ? "; base=arquivo anexado" : ""
  }. Use esses dados e NÃO pergunte de novo por eles. O tema vem somente daqui e do pedido, nunca de conversas ou documentos anteriores.]`;
}

/**
 * Remove perguntas da AURA sobre o que o usuário já informou (tema, série, quantidade...).
 * É uma trava no app: mesmo que o modelo pergunte de novo, a tela não mostra.
 */
export function filtrarPerguntasRedundantes(perguntas: PerguntaAura[], e: Entendimento | null): PerguntaAura[] {
  if (!e) return perguntas;

  return perguntas.filter((p) => {
    const q = p.pergunta;
    if (e.tema && /\b(tema|assunto|t[oó]pico|conte[uú]do|mat[eé]ria|disciplina)\b/i.test(q)) return false;
    if (e.nivel && /\b(s[eé]rie|n[ií]vel|etapa|ano|turma|p[uú]blico)\b/i.test(q)) return false;
    if (e.quantidade && /\bquant[ao]s?\b|\bn[uú]mero\s+de\b/i.test(q)) return false;
    if (e.dificuldade && /dificuldade/i.test(q)) return false;
    if (e.gabarito && /gabarito/i.test(q)) return false;
    if (e.formato && /\b(tipo|formato|estilo)\b.*quest/i.test(q)) return false;
    return true;
  });
}

/** Se o tema ainda não foi dito (nem há arquivo), o app mesmo pergunta o tema: não depende do modelo. */
export function garantirPerguntaDeTema(perguntas: PerguntaAura[], e: Entendimento | null, temArquivo: boolean): PerguntaAura[] {
  if (!e || e.tema || temArquivo) return perguntas;
  if (perguntas.some((p) => /\b(tema|assunto|t[oó]pico|conte[uú]do)\b/i.test(p.pergunta))) return perguntas;

  const o = e.tipo === "plano" ? "do plano de aula" : e.tipo === "material" ? "do material" : "da prova";
  return [{ pergunta: `Qual é o tema ${o}?`, opcoes: [] }, ...perguntas];
}
