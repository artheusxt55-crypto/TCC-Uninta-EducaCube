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

export function interpretarPerguntas(bruto: string): PerguntaAura[] {
  let dados: unknown;

  try {
    dados = JSON.parse(bruto);
  } catch {
    return [];
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

/** Separa o texto visível do cartão de perguntas. Nunca lança. */
export function extrairPerguntas(conteudo: string): { texto: string; perguntas: PerguntaAura[] } {
  const achado = BLOCO.exec(conteudo);

  if (!achado) {
    return { texto: conteudo.replace(BLOCO_ABERTO, "").trim(), perguntas: [] };
  }

  return {
    texto: conteudo.replace(BLOCO, "").replace(BLOCO_ABERTO, "").trim(),
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
