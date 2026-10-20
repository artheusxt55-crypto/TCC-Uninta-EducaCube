// Os três endpoints que antes eram abertos agora exigem origem + login + e-mail verificado.
import test, { mock, before } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

process.env.DADOS_CHAVE_CRIPTO = randomBytes(32).toString("base64");
process.env.FIREBASE_SERVICE_ACCOUNT_KEY = "{}";
process.env.ALLOWED_ORIGINS = "https://educacube.online";

const TOKENS = {
  ok: { uid: "u1", email: "ana@x.com", email_verified: true },
  naoverif: { uid: "u2", email: "bia@x.com", email_verified: false },
};
const adminAuth = {
  verifyIdToken: async (t) => {
    if (!TOKENS[t]) throw new Error("x");
    return { ...TOKENS[t] };
  },
};

const H = {};
before(async () => {
  mock.module("firebase-admin/app", { namedExports: { getApps: () => [1], initializeApp() {}, cert: (x) => x } });
  mock.module("firebase-admin/auth", { namedExports: { getAuth: () => adminAuth } });
  mock.module(new URL("./neon.js", import.meta.url).href, { namedExports: { sql: async () => [] } });
  H.imagens = (await import("../imagens.js")).default;
  H.analisar = (await import("../analisar.js")).default;
  H.falar = (await import("../falar.js")).default;
});

function chamar(handler, { token, headers = {}, method = "POST", body = { prompt: "gato", texto: "oi" } } = {}) {
  const req = {
    method,
    body,
    headers: { host: "educacube.online", ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
  };
  const saida = { status: 200, json: null };
  const res = {
    setHeader() {},
    status(c) { saida.status = c; return this; },
    json(j) { saida.json = j; return this; },
    end() { return this; },
    send() { return this; },
  };
  return handler(req, res).then(() => saida);
}

for (const nome of ["imagens", "analisar", "falar"]) {
  test(`${nome}: sem login -> 401`, async () => assert.equal((await chamar(H[nome], {})).status, 401));
  test(`${nome}: token inválido -> 401`, async () => assert.equal((await chamar(H[nome], { token: "lixo" })).status, 401));
  test(`${nome}: e-mail não verificado -> 403`, async () => {
    const r = await chamar(H[nome], { token: "naoverif" });
    assert.equal(r.status, 403);
    assert.equal(r.json.codigo, "EMAIL_NOT_VERIFIED");
  });
  test(`${nome}: site de terceiros -> 403 mesmo com token válido`, async () => {
    const r = await chamar(H[nome], { token: "ok", headers: { origin: "https://evil.com" } });
    assert.equal(r.status, 403);
    assert.equal(r.json.codigo, "ORIGIN_NOT_ALLOWED");
  });
}

test("imagens: usuário legítimo continua funcionando", async () => {
  const r = await chamar(H.imagens, { token: "ok", headers: { origin: "https://educacube.online" } });
  assert.equal(r.status, 200);
  assert.match(r.json.url, /^https:\/\/image\.pollinations\.ai\//);
});
