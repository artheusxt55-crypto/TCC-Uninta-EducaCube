import test from "node:test";
import assert from "node:assert/strict";
import {
  detectarCriacao, passosDe, montarPedido, passosDasPerguntas, montarRespostasDoModelo,
} from "../src/lib/aura-assistente.ts";

test("detecta pedido de prova e extrai tema e nível", () => {
  const c = detectarCriacao("crie uma prova de Piaget para o ensino médio")!;
  assert.equal(c.tipo, "prova");
  assert.equal(c.previas.tema, "Piaget");
  assert.equal(c.previas.nivel, "Ensino Médio");
});

test("não inventa tema quando o pedido é genérico", () => {
  const c = detectarCriacao("crie uma prova para meus alunos")!;
  assert.equal(c.tipo, "prova");
  assert.equal(c.previas.tema, undefined);
  const d = detectarCriacao("faça uma prova de meus alunos")!;
  assert.equal(d.previas.tema, undefined);
});

test("extrai quantidade e corta o tema antes de 'para'", () => {
  const c = detectarCriacao("gere uma prova de matemática para o 9º ano com 12 questões")!;
  assert.equal(c.previas.tema, "matemática");
  assert.equal(c.previas.nivel, "Ensino Fundamental (anos finais)");
  assert.equal(c.previas.quantidade, "12");
});

test("plano de aula e material", () => {
  assert.equal(detectarCriacao("monte um plano de aula sobre alfabetização")!.tipo, "plano");
  assert.equal(detectarCriacao("elabore um resumo sobre fotossíntese")!.tipo, "material");
});

test("não dispara para dúvidas, ajustes, pedidos sem verbo de criação ou muito longos", () => {
  assert.equal(detectarCriacao("o que é uma prova diagnóstica?"), null);
  assert.equal(detectarCriacao("explique as teorias de Piaget"), null);
  assert.equal(detectarCriacao("prova de Piaget"), null);
  assert.equal(detectarCriacao("crie uma prova " + "x".repeat(300)), null);
  assert.equal(detectarCriacao("oi"), null);
});

test("cada tipo tem passos, tema e nível primeiro, e extra opcional no fim", () => {
  for (const t of ["prova", "plano", "material"] as const) {
    const p = passosDe(t);
    assert.equal(p[0].id, "tema");
    assert.equal(p[1].id, "nivel");
    assert.equal(p[p.length - 1].obrigatoria, false);
    assert.equal(new Set(p.map((x) => x.id)).size, p.length);
  }
});

test("pedido de prova final traz tudo e manda criar sem perguntar", () => {
  const r = { tema: "Piaget", nivel: "Ensino Médio", quantidade: "10", formato: "Múltipla escolha", dificuldade: "Média", gabarito: "Comentado (explica cada resposta)", extra: "estilo ENEM" };
  const p = montarPedido("prova", r);
  for (const trecho of ["Piaget", "Ensino Médio", "10 questões", "múltipla escolha", "## Gabarito", "estilo ENEM", "sem fazer perguntas"]) {
    assert.ok(p.includes(trecho), trecho);
  }
  assert.ok(montarPedido("prova", { ...r, gabarito: "Sem gabarito" }).includes("Não inclua gabarito"));
});

test("perguntas do modelo viram passos e respostas", () => {
  const passos = passosDasPerguntas([{ pergunta: "Série?", opcoes: ["Médio"] }, { pergunta: "Quantas?", opcoes: [] }]);
  assert.equal(passos.length, 2);
  assert.equal(montarRespostasDoModelo(passos, { p0: "Médio", p1: "" }), "1. Série? Médio");
  assert.match(montarRespostasDoModelo(passos, {}), /Pode decidir você/);
});

import { ehPedidoDeCriacao, recortarContextoCriacao } from "../src/lib/aura-assistente.ts";

test("recortarContextoCriacao: pedido novo isola o histórico anterior", () => {
  const msgs = [
    { role: "user", content: "Crie uma prova de matemática sobre frações" },
    { role: "assistant", content: "# Prova de frações ..." },
    { role: "user", content: "Faça uma prova de história sobre o Brasil Colônia" },
  ];
  const r = recortarContextoCriacao(msgs);
  assert.equal(r.length, 1);
  assert.match(r[0].content, /história/);
});

test("recortarContextoCriacao: mantém perguntas e respostas do pedido atual", () => {
  const msgs = [
    { role: "user", content: "Oi" },
    { role: "user", content: "Monte uma prova de ciências" },
    { role: "assistant", content: "perguntas" },
    { role: "user", content: "1. Série? 6º ano" },
  ];
  assert.equal(recortarContextoCriacao(msgs).length, 3);
  assert.equal(ehPedidoDeCriacao("O que é fotossíntese?"), false);
});

import { respostaVeioDePedidoDeDocumento } from "../src/lib/aura-assistente.ts";

test("cartão só para respostas de pedido de documento", () => {
  const conversa = [
    { role: "user", content: "O que é construtivismo?" },
    { role: "assistant", content: "resposta longa" },
    { role: "user", content: "Crie uma prova de português" },
    { role: "assistant", content: "# Prova" },
  ];
  assert.equal(respostaVeioDePedidoDeDocumento(conversa, 1), false);
  assert.equal(respostaVeioDePedidoDeDocumento(conversa, 3), true);
});
