// Rodar: npm run test:api   (Firebase Admin e Neon são SIMULADOS; não há rede)
import test, { mock, before } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

process.env.DADOS_CHAVE_CRIPTO = randomBytes(32).toString("base64");
process.env.FIREBASE_SERVICE_ACCOUNT_KEY = "{}";
process.env.ALLOWED_ORIGINS = "https://educacube.online";

const TOKENS = {
  "ok-aluno": { uid: "u1", email: "ana@x.com", email_verified: true },
  "ok-prof": { uid: "u2", email: "bia@x.com", email_verified: true },
  naoverif: { uid: "u3", email: "cy@x.com", email_verified: false },
  "pend-prof": { uid: "u4", email: "di@x.com", email_verified: true, papelPendente: "professor" },
  recriada: { uid: "u9", email: "ana@x.com", email_verified: true },
};
const claims = {};
const adminAuth = {
  verifyIdToken: async (t) => {
    if (!TOKENS[t]) throw new Error("x");
    return { ...TOKENS[t] };
  },
  getUser: async (uid) => ({ customClaims: claims[uid] || {} }),
  setCustomUserClaims: async (uid, c) => {
    claims[uid] = c;
  },
};

let users = [];
let proxId = 1;
const sql = async (partes, ...v) => {
  const q = partes.join("?").replace(/\s+/g, " ");
  if (/^ ?SELECT id, status, email, display_name, photo_url, email_hash FROM users WHERE firebase_uid/.test(q))
    return users.filter((u) => u.firebase_uid === v[0]);
  if (/^ ?UPDATE users SET email =/.test(q)) {
    const u = users.find((x) => x.id === v[4]);
    Object.assign(u, { email: v[0], display_name: v[1], photo_url: v[2], email_hash: v[3] });
    return [u];
  }
  if (/^ ?INSERT INTO users/.test(q)) {
    if (users.some((u) => u.email_hash && u.email_hash === v[4])) {
      const e = new Error("dup");
      e.code = "23505";
      throw e;
    }
    const u = { id: proxId++, firebase_uid: v[0], email: v[1], display_name: v[2], photo_url: v[3], email_hash: v[4], status: "active", role: null };
    users.push(u);
    return [u];
  }
  if (/^ ?UPDATE users SET role =/.test(q)) {
    const u = users.find((x) => x.id === v[1]);
    if (u && u.role == null) {
      u.role = v[0];
      return [{ role: u.role }];
    }
    return [];
  }
  if (/^ ?SELECT role FROM users WHERE id =/.test(q)) return [{ role: users.find((x) => x.id === v[0])?.role ?? null }];
  if (/email_hash = \?\) ORDER BY/.test(q)) {
    const [uid, hash] = [v[0], v[1]];
    const ach = users.filter((u) => u.firebase_uid === uid || (hash && u.email_hash === hash));
    ach.sort((a, b) => (b.firebase_uid === uid) - (a.firebase_uid === uid));
    return ach.slice(0, 1).map((u) => ({ role: u.role }));
  }
  if (/^ ?SELECT id, status, role FROM users WHERE firebase_uid/.test(q))
    return users.filter((u) => u.firebase_uid === v[0]).map(({ id, status, role }) => ({ id, status, role }));
  throw new Error("SQL não previsto no teste: " + q);
};

let S;
before(async () => {
  mock.module("firebase-admin/app", { namedExports: { getApps: () => [1], initializeApp() {}, cert: (x) => x } });
  mock.module("firebase-admin/auth", { namedExports: { getAuth: () => adminAuth } });
  mock.module(new URL("./neon.js", import.meta.url).href, { namedExports: { sql } });
  S = await import("./seguranca.js");
});

const req = (token, headers = {}) => ({ headers: { authorization: token ? `Bearer ${token}` : "", ...headers } });
const codigo = async (fn) => {
  try {
    await fn();
    return null;
  } catch (e) {
    return e.codigo ?? e.message;
  }
};

test("sem token -> 401", async () => assert.equal(await codigo(() => S.autenticar(req(""))), "AUTH_REQUIRED"));
test("token inválido -> 401", async () => assert.equal(await codigo(() => S.autenticar(req("lixo"))), "AUTH_INVALID"));
test("e-mail NÃO verificado -> 403 EMAIL_NOT_VERIFIED", async () =>
  assert.equal(await codigo(() => S.autenticar(req("naoverif"))), "EMAIL_NOT_VERIFIED"));
test("e-mail verificado passa", async () => assert.equal((await S.autenticar(req("ok-aluno"))).uid, "u1"));

test("origem: outro site é recusado", async () =>
  assert.equal(
    await codigo(() => S.verificarOrigem({ headers: { origin: "https://site-malicioso.com", host: "educacube.online" } })),
    "ORIGIN_NOT_ALLOWED",
  ));
test("origem: mesmo domínio e lista permitida passam; sem Origin passa", () => {
  S.verificarOrigem({ headers: { origin: "https://educacube.online", host: "x.vercel.app" } });
  S.verificarOrigem({ headers: { origin: "https://meu-app.vercel.app", "x-forwarded-host": "meu-app.vercel.app" } });
  S.verificarOrigem({ headers: {} });
});
test("CORS nunca usa * e não ecoa origem desconhecida", () => {
  const h = {};
  const res = { setHeader: (k, v) => { h[k] = v; } };
  S.configurarCors({ headers: { origin: "https://site-malicioso.com", host: "educacube.online" } }, res);
  assert.equal(h["Access-Control-Allow-Origin"], undefined);
  S.configurarCors({ headers: { origin: "https://educacube.online", host: "educacube.online" } }, res);
  assert.equal(h["Access-Control-Allow-Origin"], "https://educacube.online");
});

test("primeiro acesso cria usuário com dados CIFRADOS no banco", async () => {
  const dec = await S.autenticar(req("ok-aluno"));
  const u = await S.obterOuCriarUsuario(dec);
  const linha = users.find((x) => x.firebase_uid === "u1");
  assert.ok(linha.email.startsWith("enc:v1:") && !linha.email.includes("ana@x.com"));
  assert.ok(linha.email_hash && !linha.email_hash.includes("ana"));
  assert.equal(u.email, "ana@x.com");
});

test("papel: definido uma vez; aluno NÃO vira professor", async () => {
  const dec = await S.autenticar(req("ok-aluno"));
  const u = await S.obterOuCriarUsuario(dec);
  assert.equal(await S.aplicarPapel(u, dec, "aluno"), "aluno");
  assert.equal(claims.u1.role, "aluno");
  const u2 = await S.obterOuCriarUsuario(dec);
  assert.equal(await codigo(() => S.aplicarPapel(u2, dec, "professor")), "ROLE_MISMATCH");
  assert.equal(users.find((x) => x.firebase_uid === "u1").role, "aluno");
});
test("papel: professor NÃO vira aluno", async () => {
  const dec = await S.autenticar(req("ok-prof"));
  const u = await S.obterOuCriarUsuario(dec);
  await S.aplicarPapel(u, dec, "professor");
  assert.equal(await codigo(() => S.aplicarPapel({ ...u, role: "professor" }, dec, "aluno")), "ROLE_MISMATCH");
});
test("cadastro: papel escolhido é travado ANTES de verificar o e-mail", async () => {
  const dec = await S.autenticar(req("pend-prof"));
  assert.equal(await S.definirPapelPendente({ ...dec, papelPendente: undefined }, "professor"), "professor");
  assert.equal(claims.u4.papelPendente, "professor");
  assert.equal(await codigo(() => S.definirPapelPendente(dec, "aluno")), "ROLE_MISMATCH");
  const u = await S.obterOuCriarUsuario(dec);
  assert.equal(await codigo(() => S.aplicarPapel(u, dec, "aluno")), "ROLE_MISMATCH");
  assert.equal(await S.aplicarPapel(u, dec, undefined), "professor");
  assert.equal(claims.u4.papelPendente, undefined);
});
test("mesmo e-mail nunca assume dois papéis (conta recriada no Firebase)", async () => {
  const dec = await S.autenticar(req("recriada"));
  assert.equal(await codigo(() => S.definirPapelPendente(dec, "professor")), "ROLE_MISMATCH");
  assert.equal(await codigo(() => S.obterOuCriarUsuario(dec)), "EMAIL_ALREADY_LINKED");
});
test("exigirPapel: só o papel certo entra; e-mail não verificado nunca", async () => {
  assert.equal((await S.exigirPapel(req("ok-aluno"), "aluno")).usuario.role, "aluno");
  assert.equal(await codigo(() => S.exigirPapel(req("ok-aluno"), "professor")), "FORBIDDEN_ROLE");
  assert.equal(await codigo(() => S.exigirPapel(req("naoverif"), "aluno")), "EMAIL_NOT_VERIFIED");
  assert.equal(
    await codigo(() => S.exigirPapel(req("ok-aluno", { origin: "https://evil.com", host: "educacube.online" }), "aluno")),
    "ORIGIN_NOT_ALLOWED",
  );
});
