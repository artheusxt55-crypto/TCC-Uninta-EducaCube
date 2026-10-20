import { AURA_INSTRUCTIONS } from "./instructions.js";
import { EDUCACUBE_KNOWLEDGE } from "./knowledge.js";

export async function construirContextoRAG({
  pergunta,
  contexto = [],
  uid,
}) {
  const historico =
    Array.isArray(contexto) && contexto.length > 0
      ? contexto.join("\n")
      : "Nenhum histórico adicional foi fornecido.";

  return `
${AURA_INSTRUCTIONS}

========================================
CONHECIMENTO DO EDUCACUBE
========================================

${EDUCACUBE_KNOWLEDGE}

========================================
CONTEXTO DA CONVERSA
========================================

${historico}

========================================
PERGUNTA ATUAL
========================================

${pergunta}

========================================
IDENTIFICAÇÃO
========================================

Usuário autenticado: ${uid ? "sim" : "não"}

========================================
INSTRUÇÃO FINAL
========================================

Responda à pergunta considerando as instruções,
o conhecimento disponível e o contexto da conversa.

Não invente informações que não estejam sustentadas
pelo conhecimento disponível ou pelo contexto fornecido.
`;
}
