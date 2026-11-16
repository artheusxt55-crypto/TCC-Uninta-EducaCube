import test from "node:test";
import assert from "node:assert/strict";
import { detectarDocumento } from "../src/lib/aura-documento.ts";

const prova = `# Prova de Matemática - 9º ano

${Array.from({ length: 4 }, (_, i) => `${i + 1}. Quanto é ${i}+${i}?\n   a) 1\n   b) 2\n   c) 3\n   d) 4`).join("\n\n")}

## Gabarito
1. b
2. c
3. a
4. d
${"texto ".repeat(40)}`;

test("detecta prova com gabarito", () => {
  const d = detectarDocumento(prova);
  assert.equal(d?.tipo, "prova");
  assert.equal(d?.temGabarito, true);
  assert.equal(d?.titulo, "Prova de Matemática - 9º ano");
});

test("detecta plano de aula", () => {
  const d = detectarDocumento("# Plano de aula: Frações\n\n" + "Objetivo da aula e etapas. ".repeat(30));
  assert.equal(d?.tipo, "plano");
});

test("conversa comum não vira documento", () => {
  assert.equal(detectarDocumento("Claro! Posso te ajudar com isso. " + "Explicação. ".repeat(60)), null);
  assert.equal(detectarDocumento("# Título\n\ncurto"), null);
});
