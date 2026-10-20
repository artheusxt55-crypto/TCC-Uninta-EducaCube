import test from "node:test";
import assert from "node:assert/strict";
import { casar, existeComOutroMetodo } from "./roteador.js";

const rotas = [
  { metodo: "GET", caminho: "turmas" },
  { metodo: "POST", caminho: "turmas" },
  { metodo: "GET", caminho: "turmas/:id" },
  { metodo: "GET", caminho: "turmas/:id/atividades" },
  { metodo: "PUT", caminho: "atividades/:id/entrega" },
];

test("casa rota fixa e com parâmetro", () => {
  assert.equal(casar(rotas, "GET", "turmas").rota.caminho, "turmas");
  assert.deepEqual(casar(rotas, "GET", "turmas/abc").params, { id: "abc" });
  assert.deepEqual(casar(rotas, "GET", "turmas/abc/atividades").params, { id: "abc" });
});
test("ignora barras extras", () => assert.ok(casar(rotas, "GET", "/turmas/abc/")));
test("método errado ou caminho desconhecido não casa", () => {
  assert.equal(casar(rotas, "DELETE", "turmas"), null);
  assert.equal(casar(rotas, "GET", "alunos"), null);
  assert.equal(casar(rotas, "GET", "turmas/a/b/c"), null);
});
test("detecta existência com outro método (405)", () => {
  assert.equal(existeComOutroMetodo(rotas, "DELETE", "turmas"), true);
  assert.equal(existeComOutroMetodo(rotas, "DELETE", "nada"), false);
});
test("caminho não pode ‘escapar’ do molde", () => {
  assert.equal(casar(rotas, "GET", "turmas/../atividades"), null);
  assert.equal(casar(rotas, "GET", "turmas/%2e%2e"), null);
  assert.equal(casar(rotas, "GET", "turmas/a%2Fb"), null);
});
