import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { cifrar, decifrar, estaCifrado, garantirCifrado, indiceCego } from "./cripto.js";

beforeEach(() => {
  process.env.DADOS_CHAVE_CRIPTO = randomBytes(32).toString("base64");
});

test("cifra e decifra", () => {
  const c = cifrar("ana@exemplo.com", "users.email");
  assert.ok(estaCifrado(c));
  assert.ok(!c.includes("ana@exemplo.com"));
  assert.equal(decifrar(c, "users.email"), "ana@exemplo.com");
});
test("suporta acentos e emoji", () =>
  assert.equal(decifrar(cifrar("José ✨ Çedilha", "users.display_name"), "users.display_name"), "José ✨ Çedilha"));
test("mesmo texto gera cifras diferentes (IV aleatório)", () =>
  assert.notEqual(cifrar("x@y.com", "users.email"), cifrar("x@y.com", "users.email")));
test("valor movido para outra coluna NÃO decifra", () =>
  assert.throws(() => decifrar(cifrar("x@y.com", "users.email"), "users.display_name")));
test("adulteração é detectada", () => {
  const c = cifrar("x@y.com", "users.email");
  const adulterado = c.slice(0, -2) + (c.endsWith("AA") ? "BB" : "AA");
  assert.throws(() => decifrar(adulterado, "users.email"));
});
test("chave diferente não decifra", () => {
  const c = cifrar("x@y.com", "users.email");
  process.env.DADOS_CHAVE_CRIPTO = randomBytes(32).toString("base64");
  assert.throws(() => decifrar(c, "users.email"));
});
test("texto antigo (sem prefixo) passa direto", () => assert.equal(decifrar("antigo@exemplo.com", "users.email"), "antigo@exemplo.com"));
test("garantirCifrado cifra texto puro e mantém o já cifrado", () => {
  const c = garantirCifrado("a@b.com", "users.email");
  assert.ok(estaCifrado(c));
  assert.equal(garantirCifrado(c, "users.email"), c);
  assert.equal(garantirCifrado("", "users.email"), null);
});
test("índice cego ignora caixa/espaços e não revela o e-mail", () => {
  const h = indiceCego("  Ana@Exemplo.com ");
  assert.equal(h, indiceCego("ana@exemplo.com"));
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.notEqual(h, indiceCego("outra@exemplo.com"));
});
test("sem chave ou chave curta: falha fechada", () => {
  delete process.env.DADOS_CHAVE_CRIPTO;
  assert.throws(() => cifrar("x", "c"), /não está configurada/);
  process.env.DADOS_CHAVE_CRIPTO = Buffer.from("curta").toString("base64");
  assert.throws(() => cifrar("x", "c"), /32 bytes/);
});
