import test from "node:test";
import assert from "node:assert/strict";
import { ehTurnoDeCriacao, MARCA_CRIACAO } from "./index.js";

test("turno de criação é reconhecido pela marca do sistema", () => {
  assert.equal(ehTurnoDeCriacao(`Crie uma prova\n\n${MARCA_CRIACAO} SOBRE ESTE PEDIDO]`), true);
  assert.equal(ehTurnoDeCriacao("Explique Piaget"), false);
  assert.equal(ehTurnoDeCriacao(undefined), false);
});
