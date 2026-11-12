import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";

process.env.DADOS_CHAVE_CRIPTO = randomBytes(32).toString("base64");

// Banco falso em memória, reconhecendo cada consulta pelo texto do SQL.
const banco = { itens: [], config: {}, usuarios: new Set(["u1", "u2"]) };

const sql = async (partes, ...v) => {
  const q = partes.join("?");

  if (q.includes("SELECT count(*)")) return [{ total: banco.itens.filter((i) => i.uid === v[0]).length }];

  if (q.includes("INSERT INTO aura_itens")) {
    const [tipo, titulo, conteudo, uid] = [v[0], v[1], v[2], v[3]];
    if (!banco.usuarios.has(uid)) return [];
    const linha = { id: randomUUID(), uid, tipo, titulo, conteudo, criado_em: new Date(), atualizado_em: new Date() };
    banco.itens.push(linha);
    return [linha];
  }

  if (q.includes("SELECT tipo FROM aura_itens")) {
    const i = banco.itens.find((x) => x.id === v[0] && x.uid === v[1]);
    return i ? [{ tipo: i.tipo }] : [];
  }

  if (q.includes("UPDATE aura_itens")) {
    const i = banco.itens.find((x) => x.id === v[2] && x.uid === v[3]);
    if (!i) return [];
    i.titulo = v[0];
    i.conteudo = v[1];
    return [i];
  }

  if (q.includes("DELETE FROM aura_itens")) {
    const n = banco.itens.findIndex((x) => x.id === v[0] && x.uid === v[1]);
    if (n < 0) return [];
    return banco.itens.splice(n, 1).map((x) => ({ id: x.id }));
  }

  if (q.includes("FROM aura_itens") && q.includes("ORDER BY")) {
    return banco.itens.filter((x) => x.uid === v[0] && x.tipo === v[1]);
  }

  if (q.includes("INSERT INTO aura_config")) {
    const [dados, uid] = v;
    if (!banco.usuarios.has(uid)) return [];
    banco.config[uid] = dados;
    return [{ uid }];
  }

  if (q.includes("SELECT dados FROM aura_config")) {
    return banco.config[v[0]] ? [{ dados: banco.config[v[0]] }] : [];
  }

  throw new Error("SQL inesperado: " + q);
};

mock.module("./neon.js", { namedExports: { sql } });
const m = await import("./aura-dados.js");

const reset = () => {
  banco.itens = [];
  banco.config = {};
};

test("cria, lista cifrado e lê de volta", async () => {
  reset();
  const item = await m.criarItem("u1", { tipo: "prova", titulo: "  Prova   de Piaget ", conteudo: "1) Questão" });
  assert.equal(item.titulo, "Prova de Piaget");
  assert.ok(!banco.itens[0].conteudo.includes("Questão"), "conteúdo deve estar cifrado");
  assert.ok(!banco.itens[0].titulo.includes("Piaget"), "título deve estar cifrado");
  const lista = await m.listarItens("u1", "prova");
  assert.equal(lista.length, 1);
  assert.equal(lista[0].conteudo, "1) Questão");
});

test("um usuário não enxerga nem altera itens de outro", async () => {
  reset();
  const item = await m.criarItem("u1", { tipo: "estudo", titulo: "Plano", conteudo: "texto" });
  assert.deepEqual(await m.listarItens("u2", "estudo"), []);
  await assert.rejects(m.atualizarItem("u2", item.id, { titulo: "x", conteudo: "y" }), { codigo: "ITEM_NAO_ENCONTRADO" });
  await assert.rejects(m.excluirItem("u2", item.id), { codigo: "ITEM_NAO_ENCONTRADO" });
  assert.equal((await m.listarItens("u1", "estudo")).length, 1);
});

test("atualiza e exclui o próprio item", async () => {
  reset();
  const item = await m.criarItem("u1", { tipo: "material", titulo: "A", conteudo: "B" });
  const novo = await m.atualizarItem("u1", item.id, { titulo: "A2", conteudo: "B2" });
  assert.equal(novo.titulo, "A2");
  assert.equal(novo.conteudo, "B2");
  await m.excluirItem("u1", item.id);
  assert.equal((await m.listarItens("u1", "material")).length, 0);
});

test("valida tipo, título, conteúdo, id e tamanho", async () => {
  await assert.rejects(m.criarItem("u1", { tipo: "outro", titulo: "a", conteudo: "b" }), { codigo: "TIPO_INVALIDO" });
  await assert.rejects(m.criarItem("u1", { tipo: "prova", titulo: "  ", conteudo: "b" }), { codigo: "TITULO_VAZIO" });
  await assert.rejects(m.criarItem("u1", { tipo: "prova", titulo: "a", conteudo: "" }), { codigo: "CONTEUDO_VAZIO" });
  await assert.rejects(
    m.criarItem("u1", { tipo: "prova", titulo: "a", conteudo: "x".repeat(m.LIMITES.charsConteudo + 1) }),
    { codigo: "CONTEUDO_GRANDE" }
  );
  await assert.rejects(m.excluirItem("u1", "' OR 1=1 --"), { codigo: "ID_INVALIDO" });
});

test("respeita o limite de itens por usuário", async () => {
  reset();
  for (let i = 0; i < m.LIMITES.itensPorUsuario; i++) {
    banco.itens.push({ id: randomUUID(), uid: "u1", tipo: "estudo", titulo: "t", conteudo: "c" });
  }
  await assert.rejects(m.criarItem("u1", { tipo: "estudo", titulo: "a", conteudo: "b" }), { codigo: "LIMITE_ITENS" });
});

test("usuário sem conta na plataforma não grava", async () => {
  reset();
  await assert.rejects(m.criarItem("fantasma", { tipo: "estudo", titulo: "a", conteudo: "b" }), {
    codigo: "USUARIO_NAO_ENCONTRADO",
  });
  await assert.rejects(m.salvarConfig("fantasma", { tom: "formal" }), { codigo: "USUARIO_NAO_ENCONTRADO" });
});

test("config: padrão, valores inválidos viram padrão, grava cifrado", async () => {
  reset();
  assert.deepEqual(await m.lerConfig("u1"), m.CONFIG_PADRAO);
  assert.equal(await m.lerConfigParaPrompt("u1"), null);

  const salva = await m.salvarConfig("u1", { tom: "formal", nivel: "hacker", tamanho: "curta", instrucoes: "  cite a   BNCC " });
  assert.deepEqual(salva, { tom: "formal", nivel: "intermediario", tamanho: "curta", instrucoes: "cite a BNCC" });
  assert.ok(!banco.config.u1.includes("formal"), "config deve estar cifrada");
  assert.deepEqual(await m.lerConfig("u1"), salva);
  assert.deepEqual(await m.lerConfigParaPrompt("u1"), salva);
  assert.deepEqual(await m.lerConfig("u2"), m.CONFIG_PADRAO);
});

test("config ilegível (outro UID) volta ao padrão sem lançar", async () => {
  reset();
  await m.salvarConfig("u1", { tom: "formal" });
  banco.config.u2 = banco.config.u1;
  assert.deepEqual(await m.lerConfig("u2"), m.CONFIG_PADRAO);
});

test("limparAnexos: no máximo 3 arquivos e ignora lixo", () => {
  const r = m.limparAnexos([
    { nome: "a.txt", texto: "x" },
    { nome: "c.txt", texto: "" },
    null,
    "texto",
    { nome: "b.txt", texto: "y" },
    { nome: "d.txt", texto: "z" },
    { nome: "e.txt", texto: "w" },
  ]);
  assert.deepEqual(r.map((a) => a.nome), ["a.txt", "b.txt", "d.txt"]);
  assert.deepEqual(m.limparAnexos("nada"), []);
});

test("limparAnexos: corta o texto total e marca como cortado", () => {
  const r = m.limparAnexos([
    { nome: "a.txt", texto: "x".repeat(10000) },
    { nome: "b.txt", texto: "y".repeat(10000) },
    { nome: "c.txt", texto: "z" },
  ]);
  assert.equal(r.length, 2);
  assert.equal(r[0].cortado, false);
  assert.equal(r[1].texto.length, 5000);
  assert.equal(r[1].cortado, true);
});

test("extrairTextoPdf recusa vazio, grande e não-PDF", async () => {
  await assert.rejects(m.extrairTextoPdf(""), { codigo: "PDF_VAZIO" });
  await assert.rejects(m.extrairTextoPdf(Buffer.from("texto qualquer").toString("base64")), { codigo: "PDF_INVALIDO" });
  const grande = Buffer.concat([Buffer.from("%PDF-"), Buffer.alloc(m.LIMITES.pdfBytes)]).toString("base64");
  await assert.rejects(m.extrairTextoPdf(grande), { codigo: "PDF_GRANDE" });
});
