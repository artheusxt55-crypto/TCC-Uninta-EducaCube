/* Perguntas de auditoria da AURA (estilo "cartão de perguntas").
   Antes de criar provas, planos ou documentos, a AURA pode devolver um bloco assim:

   ```aura-perguntas
   [{"pergunta":"Para qual série?","opcoes":["Fundamental","Médio","Superior"]}]
   ```

   O front troca o bloco por um cartão clicável. Se o modelo errar o JSON, o bloco é apenas
   escondido do texto e a conversa segue normalmente (o usuário responde digitando). */

export interface PerguntaAura {
  pergunta: string;
  opcoes: string[];
}

const BLOCO = /```aura-perguntas\s*\n([\s\S]*?)```/i;
const BLOCO_ABERTO = /```aura-perguntas[\s\S]*$/i; // resposta ainda chegando ou cortada

export const MAX_PERGUNTAS = 4;
export const MAX_OPCOES = 5;

function limpar(valor: unknown, max: number): string {
  return typeof valor === "string" ? valor.replace(/\s+/g, " ").trim().slice(0, max) : "";
}

/** Conserta erros comuns de JSON de modelos pequenos: aspas curvas e vírgulas sobrando. */
function repararJson(bruto: string): string {
  return bruto
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/,\s*([\]}])/g, "$1");
}

export function interpretarPerguntas(bruto: string): PerguntaAura[] {
  let dados: unknown;

  try {
    dados = JSON.parse(bruto);
  } catch {
    try {
      dados = JSON.parse(repararJson(bruto));
    } catch {
      return [];
    }
  }

  const lista = Array.isArray(dados) ? dados : (dados as { perguntas?: unknown })?.perguntas;

  if (!Array.isArray(lista)) return [];

  const saida: PerguntaAura[] = [];

  for (const item of lista) {
    if (saida.length >= MAX_PERGUNTAS) break;

    const pergunta = limpar((item as { pergunta?: unknown })?.pergunta, 200);
    const opcoesBrutas = (item as { opcoes?: unknown })?.opcoes;

    if (!pergunta) continue;

    const opcoes = Array.isArray(opcoesBrutas)
      ? opcoesBrutas.map((o) => limpar(o, 80)).filter(Boolean).slice(0, MAX_OPCOES)
      : [];

    saida.push({ pergunta, opcoes });
  }

  return saida;
}

/** Procura, em qualquer lugar do texto, um array JSON de objetos com "pergunta" (com ou sem cerca). */
function acharArraySolto(conteudo: string): { json: string; inicio: number; fim: number } | null {
  const candidato = /\[\s*\{/g;
  let m: RegExpExecArray | null;

  while ((m = candidato.exec(conteudo))) {
    let profundidade = 0;
    let emTexto = false;
    let escapado = false;

    for (let i = m.index; i < conteudo.length; i++) {
      const c = conteudo[i];

      if (emTexto) {
        if (escapado) escapado = false;
        else if (c === "\\") escapado = true;
        else if (c === '"' || c === "\u201d") emTexto = false;
        continue;
      }

      if (c === '"' || c === "\u201c") emTexto = true;
      else if (c === "[") profundidade++;
      else if (c === "]" && --profundidade === 0) {
        const json = conteudo.slice(m.index, i + 1);

        if (/["\u201c]pergunta["\u201d]/i.test(json)) return { json, inicio: m.index, fim: i + 1 };
        break;
      }
    }
  }

  return null;
}

/** Remove "aura-perguntas" (com crases, dois-pontos ou maiúsculas) que sobrou como rótulo. */
function limparRotulo(texto: string): string {
  return texto
    .replace(/(^|\n)[ \t`*_#>-]*aura[-_ ]perguntas[ \t`*_:.-]*(?=\n|$)/gi, "$1")
    .replace(/[ \t`*_#>-]*aura[-_ ]perguntas[ \t`*_:.-]*$/i, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function removerTrecho(texto: string, inicio: number, fim: number): string {
  let antes = texto.slice(0, inicio);
  let depois = texto.slice(fim);

  // cercas ``` que envolviam o array
  antes = antes.replace(/```[a-z-]*[ \t]*\n?[ \t]*$/i, "");
  depois = depois.replace(/^[ \t]*\n?[ \t]*```/, "");

  // rótulo na mesma linha: "Aura-perguntas [ ... ]"
  return limparRotulo(`${antes}\n${depois}`);
}

/** Separa o texto visível do cartão de perguntas. Nunca lança. */
export function extrairPerguntas(conteudo: string): { texto: string; perguntas: PerguntaAura[] } {
  const achado = BLOCO.exec(conteudo);

  if (!achado) {
    const solto = acharArraySolto(conteudo);

    if (solto) {
      const perguntas = interpretarPerguntas(solto.json);

      if (perguntas.length > 0) {
        return { texto: removerTrecho(conteudo, solto.inicio, solto.fim), perguntas };
      }
    }

    return { texto: limparRotulo(conteudo.replace(BLOCO_ABERTO, "")), perguntas: [] };
  }

  return {
    texto: limparRotulo(conteudo.replace(BLOCO, "").replace(BLOCO_ABERTO, "")),
    perguntas: interpretarPerguntas(achado[1].trim()),
  };
}

/** Monta a resposta do usuário a partir das escolhas (uma por pergunta, pode estar vazia). */
export function montarRespostas(perguntas: PerguntaAura[], respostas: string[]): string {
  const linhas: string[] = [];

  perguntas.forEach((p, i) => {
    const r = (respostas[i] || "").trim();
    if (r) linhas.push(`${i + 1}. ${p.pergunta} ${r}`);
  });

  return linhas.length ? linhas.join("\n") : "Pode decidir você, escolha o que for mais adequado.";
}
