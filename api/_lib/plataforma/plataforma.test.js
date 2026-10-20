// Firebase Admin e Neon SIMULADOS. Testa as BARREIRAS (papel, validação, posse), não o SQL em si.
import test, { mock, before, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

process.env.DADOS_CHAVE_CRIPTO = randomBytes(32).toString("base64");
process.env.FIREBASE_SERVICE_ACCOUNT_KEY = "{}";
process.env.ALLOWED_ORIGINS = "https://educacube.online";

const UUID_A = "11111111-1111-4111-8111-111111111111";
const UUID_B = "22222222-2222-4222-8222-222222222222";

const TOKENS = {
  aluno: { uid: "uA", email: "a@x.com", email_verified: true },
  prof: { uid: "uP", email: "p@x.com", email_verified: true },
  semPapel: { uid: "uS", email: "s@x.com", email_verified: true },
  naoverif: { uid: "uN", email: "n@x.com", email_verified: false },
};
const CONTAS = {
  uA: { id: 1, status: "active", role: "aluno" },
  uP: { id: 2, status: "active", role: "professor" },
  uS: { id: 3, status: "active", role: null },
};

let dados = [];
let respostas = [];

const sql = async (partes, ...v) => {
  const q = partes.join("?").replace(/\s+/g, " ").trim();
  if (/^SELECT id, status, role FROM users WHERE firebase_uid/.test(q)) {
    return CONTAS[v[0]] ? [CONTAS[v[0]]] : [];
  }
  dados.push({ q, v });
  for (const [re, res] of respostas) if (re.test(q)) return typeof res === "function" ? res(v) : res;
  return [];
};

let handler;
let validacao;
before(async () => {
  mock.module("firebase-admin/app", { namedExports: { getApps: () => [1], initializeApp() {}, cert: (x) => x } });
  mock.module("firebase-admin/auth", {
    namedExports: {
      getAuth: () => ({
        verifyIdToken: async (t) => {
          if (!TOKENS[t]) throw new Error("x");
          return { ...TOKENS[t] };
        },
      }),
    },
  });
  mock.module(new URL("../neon.js", import.meta.url).href, { namedExports: { sql } });
  handler = (await import("../../plataforma.js")).default;
  validacao = await import("./validacao.js");
});
beforeEach(() => {
  dados = [];
  respostas = [];
});

async function chamar({ metodo = "GET", rota, token, corpo, headers = {} }) {
  const req = {
    method: metodo,
    query: { rota },
    body: corpo,
    headers: { host: "educacube.online", ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
  };
  const saida = { status: 200, json: null };
  const res = {
    setHeader() {},
    status(c) { saida.status = c; return this; },
    json(j) { saida.json = j; return this; },
    end() { return this; },
  };
  await handler(req, res);
  return saida;
}

/* ---------- autenticação / papel ---------- */
test("sem token -> 401", async () => assert.equal((await chamar({ rota: "turmas" })).status, 401));
test("e-mail não verificado -> 403", async () =>
  assert.equal((await chamar({ rota: "turmas", token: "naoverif" })).json.codigo, "EMAIL_NOT_VERIFIED"));
test("site de terceiros -> 403", async () =>
  assert.equal(
    (await chamar({ rota: "turmas", token: "prof", headers: { origin: "https://evil.com" } })).json.codigo,
    "ORIGIN_NOT_ALLOWED",
  ));
test("conta sem papel definido -> 403", async () =>
  assert.equal((await chamar({ rota: "turmas", token: "semPapel" })).json.codigo, "FORBIDDEN_ROLE"));

/* ---------- aluno NÃO usa rotas de professor e vice-versa (sem tocar nos dados) ---------- */
const barrados = [
  ["aluno", "POST", "turmas", { nome: "X", disciplina: "Y" }],
  ["aluno", "GET", "professor/resumo"],
  ["aluno", "DELETE", `turmas/${UUID_A}`],
  ["aluno", "GET", `turmas/${UUID_A}/alunos`],
  ["aluno", "POST", `turmas/${UUID_A}/atividades`, { titulo: "T" }],
  ["aluno", "PUT", `entregas/${UUID_A}/correcao`, { nota: 10 }],
  ["prof", "POST", "matriculas", { codigo: "ABCDEF" }],
  ["prof", "GET", "atividades"],
  ["prof", "PUT", `atividades/${UUID_A}/entrega`, { resposta: "oi" }],
  ["prof", "GET", "progresso"],
];
for (const [token, metodo, rota, corpo] of barrados) {
  test(`${token} em ${metodo} ${rota.replace(UUID_A, ":id")} -> 403 sem consultar dados`, async () => {
    const r = await chamar({ token, metodo, rota, corpo });
    assert.equal(r.status, 403);
    assert.equal(r.json.codigo, "FORBIDDEN_ROLE");
    assert.equal(dados.length, 0);
  });
}

/* ---------- roteamento ---------- */
test("rota inexistente -> 404", async () => assert.equal((await chamar({ token: "prof", rota: "segredo" })).status, 404));
test("método errado -> 405", async () =>
  assert.equal((await chamar({ token: "prof", metodo: "PUT", rota: "turmas" })).status, 405));

/* ---------- validação antes de qualquer SQL ---------- */
test("id que não é UUID -> 400 sem SQL", async () => {
  const r = await chamar({ token: "prof", rota: "turmas/1' OR '1'='1" });
  assert.equal(r.status, 400);
  assert.equal(dados.length, 0);
});
test("turma sem nome -> 400 sem SQL", async () => {
  const r = await chamar({ token: "prof", metodo: "POST", rota: "turmas", corpo: { disciplina: "Mat" } });
  assert.equal(r.status, 400);
  assert.equal(dados.length, 0);
});
test("atividade com pontos absurdos / tipo inválido / prazo inválido -> 400 sem SQL", async () => {
  for (const corpo of [{ titulo: "Ok", pontos: 1000 }, { titulo: "Ok", tipo: "x" }, { titulo: "Ok", prazo: "ontem" }]) {
    const r = await chamar({ token: "prof", metodo: "POST", rota: `turmas/${UUID_A}/atividades`, corpo });
    assert.equal(r.status, 400);
  }
  assert.equal(dados.length, 0);
});
test("resposta vazia -> 400 sem SQL", async () => {
  const r = await chamar({ token: "aluno", metodo: "PUT", rota: `atividades/${UUID_A}/entrega`, corpo: { resposta: "   " } });
  assert.equal(r.status, 400);
  assert.equal(dados.length, 0);
});

/* ---------- posse (IDOR) ---------- */
test("professor pedindo turma de OUTRO professor -> 404 e a consulta carrega o uid de quem pediu", async () => {
  const r = await chamar({ token: "prof", rota: `turmas/${UUID_B}` });
  assert.equal(r.status, 404);
  assert.deepEqual(dados[0].v, [UUID_B, "uP"]);
  assert.match(dados[0].q, /professor_uid = \?/);
});
test("aluno vendo atividade de turma em que NÃO está matriculado -> 404", async () => {
  const r = await chamar({ token: "aluno", rota: `atividades/${UUID_A}` });
  assert.equal(r.status, 404);
  assert.match(dados[0].q, /JOIN matriculas m ON m\.turma_id = t\.id AND m\.aluno_uid = \?/);
});
test("aluno entregando em atividade de turma alheia -> 404, nada é gravado", async () => {
  const r = await chamar({ token: "aluno", metodo: "PUT", rota: `atividades/${UUID_A}/entrega`, corpo: { resposta: "oi" } });
  assert.equal(r.status, 404);
  assert.ok(!dados.some((d) => /INSERT INTO entregas/.test(d.q)));
});
test("professor corrigindo entrega que não é de turma sua -> 404", async () => {
  const r = await chamar({ token: "prof", metodo: "PUT", rota: `entregas/${UUID_A}/correcao`, corpo: { nota: 5 } });
  assert.equal(r.status, 404);
  assert.ok(!dados.some((d) => /UPDATE entregas/.test(d.q)));
});

/* ---------- regras de negócio ---------- */
test("nota acima dos pontos da atividade -> 400 e NÃO grava", async () => {
  respostas.push([/FROM entregas e JOIN atividades/, [{ id: UUID_A, pontos: "10.00" }]]);
  const r = await chamar({ token: "prof", metodo: "PUT", rota: `entregas/${UUID_A}/correcao`, corpo: { nota: 11 } });
  assert.equal(r.status, 400);
  assert.ok(!dados.some((d) => /UPDATE entregas/.test(d.q)));
});
test("correção válida grava e devolve a entrega", async () => {
  respostas.push([/FROM entregas e JOIN atividades/, [{ id: UUID_A, pontos: "10.00" }]]);
  respostas.push([/UPDATE entregas SET nota/, [{ id: UUID_A, nota: "8.50", feedback: "Bom", corrigida_em: "2026-01-01" }]]);
  const r = await chamar({ token: "prof", metodo: "PUT", rota: `entregas/${UUID_A}/correcao`, corpo: { nota: 8.5, feedback: "Bom" } });
  assert.equal(r.status, 200);
  assert.equal(r.json.entrega.id, UUID_A);
});
test("entrega depois do prazo -> 409 e NÃO grava", async () => {
  respostas.push([/FROM atividades a JOIN turmas/, [{ id: UUID_A, prazo: "2020-01-01T00:00:00Z" }]]);
  const r = await chamar({ token: "aluno", metodo: "PUT", rota: `atividades/${UUID_A}/entrega`, corpo: { resposta: "tarde" } });
  assert.equal(r.status, 409);
  assert.equal(r.json.codigo, "DEADLINE_PASSED");
  assert.ok(!dados.some((d) => /INSERT INTO entregas/.test(d.q)));
});
test("entrega já corrigida não pode ser alterada -> 409", async () => {
  respostas.push([/FROM atividades a JOIN turmas/, [{ id: UUID_A, prazo: null }]]);
  respostas.push([/INSERT INTO entregas/, []]);
  const r = await chamar({ token: "aluno", metodo: "PUT", rota: `atividades/${UUID_A}/entrega`, corpo: { resposta: "nova" } });
  assert.equal(r.json.codigo, "ALREADY_GRADED");
});
test("entrega válida -> 201", async () => {
  respostas.push([/FROM atividades a JOIN turmas/, [{ id: UUID_A, prazo: null }]]);
  respostas.push([/INSERT INTO entregas/, [{ id: UUID_B, enviada_em: "2026-01-01", atualizada_em: "2026-01-01" }]]);
  const r = await chamar({ token: "aluno", metodo: "PUT", rota: `atividades/${UUID_A}/entrega`, corpo: { resposta: "minha resposta" } });
  assert.equal(r.status, 201);
});
test("criar turma devolve 201 e código gerado pelo servidor; dono vem do token", async () => {
  respostas.push([/INSERT INTO turmas/, (v) => [{ id: UUID_A, nome: v[1], disciplina: v[2], codigo: v[5] }]]);
  const r = await chamar({ token: "prof", metodo: "POST", rota: "turmas", corpo: { nome: "7º A", disciplina: "Matemática", professor_uid: "hacker" } });
  assert.equal(r.status, 201);
  assert.match(r.json.turma.codigo, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.equal(dados[0].v[0], "uP");
});
test("código da turma que colide é regenerado", async () => {
  let n = 0;
  respostas.push([/INSERT INTO turmas/, (v) => {
    if (n++ < 2) { const e = new Error("dup"); e.code = "23505"; throw e; }
    return [{ id: UUID_A, nome: v[1], disciplina: v[2], codigo: v[5] }];
  }]);
  const r = await chamar({ token: "prof", metodo: "POST", rota: "turmas", corpo: { nome: "7º A", disciplina: "Mat" } });
  assert.equal(r.status, 201);
  assert.equal(n, 3);
});

/* ---------- nada de dado inventado ---------- */
test("progresso sem nenhuma correção: média é null", async () => {
  respostas.push([/FROM matriculas m JOIN turmas t/, [
    { turma_id: UUID_A, turma: "7º A", disciplina: "Mat", total: 3, entregues: 1, corrigidas: 0, media_percentual: null },
  ]]);
  const r = await chamar({ token: "aluno", rota: "progresso" });
  assert.equal(r.json.progresso.mediaPercentual, null);
  assert.equal(r.json.progresso.total, 3);
});
test("progresso sem turmas: zeros e média null", async () => {
  const r = await chamar({ token: "aluno", rota: "progresso" });
  assert.deepEqual([r.json.progresso.total, r.json.progresso.entregues, r.json.progresso.mediaPercentual], [0, 0, null]);
});
test("média ponderada só considera o que foi corrigido", async () => {
  respostas.push([/FROM matriculas m JOIN turmas t/, [
    { turma_id: UUID_A, turma: "A", disciplina: "Mat", total: 2, entregues: 2, corrigidas: 2, media_percentual: "80" },
    { turma_id: UUID_B, turma: "B", disciplina: "Port", total: 1, entregues: 0, corrigidas: 0, media_percentual: null },
  ]]);
  assert.equal((await chamar({ token: "aluno", rota: "progresso" })).json.progresso.mediaPercentual, 80);
});
test("status da atividade: corrigida > entregue > atrasada > pendente", () => {
  const agora = new Date("2026-06-01");
  const s = validacao.statusDaEntrega;
  assert.equal(s({ entrega_id: 1, corrigida_em: "x", prazo: null }, agora), "corrigida");
  assert.equal(s({ entrega_id: 1, corrigida_em: null, prazo: "2020-01-01" }, agora), "entregue");
  assert.equal(s({ entrega_id: null, corrigida_em: null, prazo: "2020-01-01" }, agora), "atrasada");
  assert.equal(s({ entrega_id: null, corrigida_em: null, prazo: "2030-01-01" }, agora), "pendente");
  assert.equal(s({ entrega_id: null, corrigida_em: null, prazo: null }, agora), "pendente");
});
