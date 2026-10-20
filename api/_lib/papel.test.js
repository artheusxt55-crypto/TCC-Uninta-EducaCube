import test from "node:test";
import assert from "node:assert/strict";
import { avaliarPapel, normalizarPapel, papelPermitido } from "./papel.js";

test("aluno nunca vira professor", () => assert.equal(avaliarPapel("aluno", "professor").acao, "negar"));
test("professor nunca vira aluno", () => assert.equal(avaliarPapel("professor", "aluno").acao, "negar"));
test("mesmo papel é mantido", () => assert.deepEqual(avaliarPapel("aluno", "aluno"), { acao: "manter", papel: "aluno" }));
test("sem pedido mantém o papel existente", () =>
  assert.deepEqual(avaliarPapel("professor", undefined), { acao: "manter", papel: "professor" }));
test("primeira vez define o papel", () =>
  assert.deepEqual(avaliarPapel(null, "professor"), { acao: "definir", papel: "professor" }));
test("sem papel e sem pedido fica pendente", () =>
  assert.deepEqual(avaliarPapel(null, undefined), { acao: "pendente", papel: null }));
test("valores inválidos são ignorados", () => {
  assert.equal(normalizarPapel("admin"), null);
  assert.equal(normalizarPapel({ a: 1 }), null);
  assert.equal(avaliarPapel(null, "admin").acao, "pendente");
  assert.equal(avaliarPapel("aluno", "admin").acao, "manter");
});
test("normaliza caixa e espaços", () => assert.equal(normalizarPapel("  Professor "), "professor"));
test("papelPermitido exige igualdade exata e papel válido", () => {
  assert.equal(papelPermitido("professor", "professor"), true);
  assert.equal(papelPermitido("aluno", "professor"), false);
  assert.equal(papelPermitido(null, "aluno"), false);
  assert.equal(papelPermitido("aluno", "admin"), false);
});
