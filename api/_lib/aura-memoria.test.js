import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

process.env.DADOS_CHAVE_CRIPTO = randomBytes(32).toString("base64");

// Banco falso em memória: reconhece cada consulta pelo texto do SQL.
const banco = { linha: null, existe: true };
const sql = async (partes, ...v) => {
  const q = partes.join("?");
  if (q.includes("INSERT INTO aura_memoria (uid)")) {
    if (banco.existe && !banco.linha) banco.linha = { perfil: null, resumo: null, ativa: true, versao: 0, ultima: null };
    return [];
  }
  if (q.includes("INSERT INTO aura_memoria (uid, ativa)")) {
    banco.linha = { ...(banco.linha || { perfil: null, resumo: null, versao: 0, ultima: null }), ativa: v[0] };
    return [];
  }
  if (q.includes("SET ultima_tentativa")) {
    const l = banco.linha;
    if (!l || !l.ativa || (l.ultima && Date.now() - l.ultima < 8000)) return [];
    l.ultima = Date.now();
    return [{ perfil: l.perfil, resumo: l.resumo, versao: l.versao }];
  }
  if (q.includes("SET perfil = NULL")) {
    banco.linha.perfil = null;
    banco.linha.resumo = null;
    banco.linha.versao++;
    return [];
  }
  if (q.includes("SET perfil =")) {
    const l = banco.linha;
    if (!l.ativa || l.versao !== v[3]) return [];
    l.perfil = v[0];
    l.resumo = v[1];
    l.versao++;
    return [{ versao: l.versao }];
  }
  if (q.includes("SELECT perfil")) return banco.linha ? [banco.linha] : [];
  throw new Error("SQL inesperado: " + q);
};

mock.module("./neon.js", { namedExports: { sql } });
const m = await import("./aura-memoria.js");

const reset = () => {
  banco.linha = null;
  banco.existe = true;
};
const PERG = "Prefiro explicações com exemplos práticos de matemática";
const gerarOk = async () => ({ perfil: ["Gosta de exemplos práticos"], resumo: "Falou de matemática." });

test("limparPerfil remove dados sensíveis, duplicados e limita tamanho", () => {
  const r = m.limparPerfil([
    "Gosta de exemplos",
    "gosta de exemplos",
    "Meu e-mail é ana@x.com",
    "CPF 123.456.789-09",
    "senha: abc",
    "(85) 98765-4321",
    42,
    "x".repeat(500),
  ]);
  assert.equal(r.length, 2);
  assert.equal(r[0], "Gosta de exemplos");
  assert.equal(r[1].length, m.LIMITES.charsItem);
});

test("interpretarJson aceita cerca de código e <think>", () => {
  const j = m.interpretarJson('<think>hmm</think>```json\n{"perfil":["a b c"],"resumo":"r"}\n```');
  assert.deepEqual(j.perfil, ["a b c"]);
  assert.equal(m.interpretarJson("sem json"), null);
});

test("atualiza, grava cifrado e lê de volta", async () => {
  reset();
  const r = await m.atualizarMemoria("u1", { pergunta: PERG, resposta: "Claro!" }, { gerar: gerarOk });
  assert.equal(r.atualizado, true);
  assert.ok(!banco.linha.perfil.includes("exemplos"), "perfil deve estar cifrado");
  const mem = await m.lerMemoria("u1");
  assert.deepEqual(mem.perfil, ["Gosta de exemplos práticos"]);
  assert.equal(mem.resumo, "Falou de matemática.");
});

test("cifra presa ao UID: outro usuário não consegue ler", async () => {
  reset();
  await m.atualizarMemoria("u1", { pergunta: PERG, resposta: "ok" }, { gerar: gerarOk });
  const mem = await m.lerMemoria("u2");
  assert.deepEqual(mem.perfil, []);
});

test("ignora comandos e perguntas curtas sem chamar a IA", async () => {
  reset();
  let chamou = false;
  const gerar = async () => ((chamou = true), null);
  assert.equal((await m.atualizarMemoria("u1", { pergunta: "/memoria", resposta: "x" }, { gerar })).motivo, "comando");
  assert.equal((await m.atualizarMemoria("u1", { pergunta: "oi", resposta: "x" }, { gerar })).motivo, "curta");
  assert.equal(chamou, false);
});

test("throttle: segunda atualização imediata é barrada", async () => {
  reset();
  await m.atualizarMemoria("u1", { pergunta: PERG, resposta: "ok" }, { gerar: gerarOk });
  const r = await m.atualizarMemoria("u1", { pergunta: PERG, resposta: "ok" }, { gerar: gerarOk });
  assert.equal(r.atualizado, false);
});

test("falha da IA não grava nem lança", async () => {
  reset();
  const r = await m.atualizarMemoria("u1", { pergunta: PERG, resposta: "ok" }, { gerar: async () => null });
  assert.equal(r.motivo, "ia_indisponivel");
  assert.equal(banco.linha.perfil, null);
});

test("pausar impede aprender e uso; ativar volta", async () => {
  reset();
  await m.atualizarMemoria("u1", { pergunta: PERG, resposta: "ok" }, { gerar: gerarOk });
  await m.executarComandoMemoria("/pausar-memoria", "u1");
  assert.equal(await m.lerMemoriaParaPrompt("u1"), null);
  banco.linha.ultima = null;
  const r = await m.atualizarMemoria("u1", { pergunta: PERG, resposta: "ok" }, { gerar: gerarOk });
  assert.equal(r.atualizado, false);
  await m.executarComandoMemoria("/ativar-memoria", "u1");
  assert.ok(await m.lerMemoriaParaPrompt("u1"));
});

test("/esquecer apaga tudo e /memoria mostra o conteúdo", async () => {
  reset();
  await m.atualizarMemoria("u1", { pergunta: PERG, resposta: "ok" }, { gerar: gerarOk });
  assert.match(await m.executarComandoMemoria("/memoria", "u1"), /exemplos práticos/);
  await m.executarComandoMemoria("/esquecer", "u1");
  assert.equal(await m.lerMemoriaParaPrompt("u1"), null);
  assert.match(await m.executarComandoMemoria("/memoria", "u1"), /Ainda não aprendi/);
});

test("usuário sem conta em users não cria memória", async () => {
  reset();
  banco.existe = false;
  const r = await m.atualizarMemoria("fantasma", { pergunta: PERG, resposta: "ok" }, { gerar: gerarOk });
  assert.equal(r.atualizado, false);
});

test("memória entra no prompt do RAG como anotação, não como instrução", async () => {
  const { construirContextoRAG } = await import("./rag/index.js");
  const p = await construirContextoRAG({ pergunta: "oi", uid: "u1", memoria: { perfil: ["Gosta de tabelas"], resumo: "Plano de aula." } });
  assert.match(p, /MEMÓRIA SOBRE ESTE USUÁRIO/);
  assert.match(p, /Gosta de tabelas/);
  const sem = await construirContextoRAG({ pergunta: "oi", uid: "u1" });
  assert.ok(!sem.includes("MEMÓRIA SOBRE"));
});
