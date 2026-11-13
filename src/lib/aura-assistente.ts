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
    obrigatoria: false,
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
