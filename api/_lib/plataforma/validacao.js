import { ErroApi } from "../seguranca.js";

/* Validação de entrada da API da plataforma (tudo que vem do cliente é suspeito). */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const invalido = (msg) => new ErroApi(400, "VALIDATION", msg);

export function uuid(valor, campo = "id") {
  if (typeof valor !== "string" || !UUID.test(valor)) throw invalido(`${campo} inválido.`);
  return valor.toLowerCase();
}

export function texto(valor, campo, { min = 0, max, obrigatorio = false } = {}) {
  if (valor === undefined || valor === null) {
    if (obrigatorio) throw invalido(`${campo} é obrigatório.`);
    return undefined;
  }
  if (typeof valor !== "string") throw invalido(`${campo} deve ser texto.`);

  const limpo = valor.trim();
  if (obrigatorio && !limpo) throw invalido(`${campo} é obrigatório.`);
  if (limpo.length < min) throw invalido(`${campo} deve ter ao menos ${min} caracteres.`);
  if (max && limpo.length > max) throw invalido(`${campo} deve ter no máximo ${max} caracteres.`);
  return limpo;
}

export function numero(valor, campo, { min, max, obrigatorio = false } = {}) {
  if (valor === undefined || valor === null || valor === "") {
    if (obrigatorio) throw invalido(`${campo} é obrigatório.`);
    return undefined;
  }
  const n = typeof valor === "number" ? valor : Number(valor);
  if (!Number.isFinite(n)) throw invalido(`${campo} deve ser um número.`);
  if (min !== undefined && n < min) throw invalido(`${campo} deve ser no mínimo ${min}.`);
  if (max !== undefined && n > max) throw invalido(`${campo} deve ser no máximo ${max}.`);
  return Math.round(n * 100) / 100;
}

/** Data ISO. `null` explícito limpa o campo (ex.: remover o prazo). */
export function data(valor, campo) {
  if (valor === undefined) return undefined;
  if (valor === null || valor === "") return null;
  const d = new Date(valor);
  if (typeof valor !== "string" || Number.isNaN(d.getTime())) {
    throw invalido(`${campo} deve ser uma data válida.`);
  }
  return d.toISOString();
}

export function booleano(valor, campo) {
  if (valor === undefined) return undefined;
  if (typeof valor !== "boolean") throw invalido(`${campo} deve ser verdadeiro ou falso.`);
  return valor;
}

export function opcao(valor, campo, permitidas, padrao) {
  if (valor === undefined || valor === null) return padrao;
  if (!permitidas.includes(valor)) throw invalido(`${campo} deve ser: ${permitidas.join(", ")}.`);
  return valor;
}

/** Situação da atividade do ponto de vista do aluno (calculada, nunca inventada). */
export function statusDaEntrega({ entrega_id, corrigida_em, prazo }, agora = new Date()) {
  if (corrigida_em) return "corrigida";
  if (entrega_id) return "entregue";
  if (prazo && new Date(prazo) < agora) return "atrasada";
  return "pendente";
}
