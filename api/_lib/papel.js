export const PAPEIS = ["aluno", "professor"];

export function normalizarPapel(valor) {
  if (typeof valor !== "string") return null;
  const v = valor.trim().toLowerCase();
  return PAPEIS.includes(v) ? v : null;
}

/**
 * Decide o que fazer dado o papel gravado e o papel pedido.
 *  já tem papel e o pedido é outro -> negar (aluno nunca vira professor)
 *  já tem papel e o pedido é igual/vazio -> manter
 *  não tem papel e veio um válido -> definir (acontece uma única vez)
 *  não tem papel e nada válido -> pendente
 */
export function avaliarPapel(atual, solicitado) {
  const a = normalizarPapel(atual);
  const s = normalizarPapel(solicitado);

  if (a) {
    if (!s || s === a) return { acao: "manter", papel: a };
    return { acao: "negar", papel: a };
  }
  if (s) return { acao: "definir", papel: s };
  return { acao: "pendente", papel: null };
}

export function papelPermitido(papelDoUsuario, exigido) {
  const e = normalizarPapel(exigido);
  return !!e && normalizarPapel(papelDoUsuario) === e;
}
