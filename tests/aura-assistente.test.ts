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

import { entenderTexto, entenderPedidoAtual, descreverEntendimento } from "../src/lib/aura-assistente.ts";

test("entenderTexto: tema, série e quantidade", () => {
  const e = entenderTexto("Crie uma prova sobre Vygotsky e a zona de desenvolvimento proximal para o ensino superior com 8 questões, com gabarito");
  assert.equal(e.tipo, "prova");
  assert.match(e.tema || "", /^Vygotsky/);
  assert.equal(e.nivel, "Ensino Superior");
  assert.equal(e.quantidade, "8");
  assert.equal(e.gabarito, "sim");
});

test("entenderTexto: 'prova de X' e 'tema:'", () => {
  assert.equal(entenderTexto("faça uma prova de fotossíntese").tema, "fotossíntese");
  assert.equal(entenderTexto("monte uma prova\nTema: Revolução Francesa").tema, "Revolução Francesa");
  assert.equal(entenderTexto("faça uma prova de 10 questões").tema, undefined);
});

test("entenderPedidoAtual junta pedido e respostas da tela", () => {
  const msgs = [
    { role: "user", content: "Crie uma prova sobre frações" },
    { role: "assistant", content: "perguntas" },
    { role: "user", content: "1. Para qual série? 6º ano\n2. Quantas questões? 10 questões" },
  ];
  const e = entenderPedidoAtual(msgs);
  assert.equal(e?.tema, "frações");
  assert.equal(e?.nivel, "6º ano");
  assert.equal(e?.quantidade, "10");
  assert.match(descreverEntendimento(e, false), /tema="frações"/);
  assert.equal(entenderPedidoAtual([{ role: "user", content: "oi" }]), null);
});

import { filtrarPerguntasRedundantes } from "../src/lib/aura-assistente.ts";

test("pedidos 'quero/preciso de uma prova' contam como criação", () => {
  assert.equal(ehPedidoDeCriacao("Quero uma prova de matemática sobre frações"), true);
  assert.equal(ehPedidoDeCriacao("Preciso de uma prova sobre Piaget para o ensino superior"), true);
  assert.equal(ehPedidoDeCriacao("O que é uma prova diagnóstica?"), false);
  assert.equal(ehPedidoDeCriacao("Você pode explicar a prova de Piaget?"), false);
  assert.equal(entenderTexto("Quero uma prova sobre Piaget").tema, "Piaget");
});

test("tema em mensagem separada", () => {
  const e = entenderPedidoAtual([
    { role: "user", content: "Preciso de uma prova" },
    { role: "assistant", content: "Qual o tema?" },
    { role: "user", content: "Vygotsky" },
  ]);
  assert.equal(e?.tema, "Vygotsky");
});

test("filtra perguntas sobre o que já foi dito", () => {
  const e = entenderTexto("Crie uma prova sobre Piaget com 10 questões");
  const perguntas = [
    { pergunta: "Qual é o tema da prova?", opcoes: ["a", "b"] },
    { pergunta: "Para qual série?", opcoes: ["6º", "7º"] },
    { pergunta: "Quantas questões?", opcoes: ["5", "10"] },
  ];
  const r = filtrarPerguntasRedundantes(perguntas, e);
  assert.deepEqual(r.map((p) => p.pergunta), ["Para qual série?"]);
  assert.equal(filtrarPerguntasRedundantes(perguntas, null).length, 3);
});

import { garantirPerguntaDeTema } from "../src/lib/aura-assistente.ts";
import { extrairPerguntas } from "../src/lib/aura-perguntas.ts";

test("vários arrays soltos viram várias perguntas e somem do texto", () => {
  const msg = `Olá! Preciso de mais detalhes.\n[{"pergunta":"Quantas questões você gostaria?","opcoes":["10","15","20"]}] [{"pergunta":"Qual nível de dificuldade prefere?","opcoes":["Fácil","Médio","Difícil"]}] [{"pergunta":"Você deseja um gabarito ao final?","opcoes":["Sim","Não"]}]`;
  const r = extrairPerguntas(msg);
  assert.equal(r.perguntas.length, 3);
  assert.ok(!r.texto.includes("pergunta"));
});

test("sem tema e sem arquivo, o app pergunta o tema", () => {
  const e = entenderTexto("Preciso de uma prova para o ensino superior");
  assert.equal(e.tema, undefined);
  const r = garantirPerguntaDeTema([{ pergunta: "Quantas questões?", opcoes: ["10"] }], e, false);
  assert.match(r[0].pergunta, /tema da prova/);
  assert.equal(r[0].opcoes.length, 0);
  assert.equal(garantirPerguntaDeTema([], e, true).length, 0);
  assert.equal(garantirPerguntaDeTema([], entenderTexto("Crie uma prova sobre Piaget"), false).length, 0);
});
