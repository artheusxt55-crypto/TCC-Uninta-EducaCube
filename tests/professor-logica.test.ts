import test from "node:test";
import assert from "node:assert/strict";
import {
  campoParaIso, isoParaCampo, lerNumero, validarAtividade, validarTurma, validarNota, formVazio, formDaAtividade,
  filtrarEntregas, contagemEntregas, mediaDaAtividade, fracao, rotuloEntrega,
} from "../src/dashboard/professor/logica.ts";

const entrega = (extra: object) => ({
  alunoUid: "u", aluno: "A", entregaId: null, resposta: null, enviadaEm: null, nota: null, feedback: null,
  corrigidaEm: null, status: "pendente", ...extra,
}) as any;

test("lerNumero aceita vírgula e rejeita vazio/lixo", () => {
  assert.equal(lerNumero("7,5"), 7.5);
  assert.equal(lerNumero(" 10 "), 10);
  assert.ok(Number.isNaN(lerNumero("")));
  assert.ok(Number.isNaN(lerNumero("abc")));
});

test("prazo: campo local <-> ISO, vazio vira null, inválido vira undefined", () => {
  assert.equal(campoParaIso(""), null);
  assert.equal(campoParaIso("lixo"), undefined);
  const iso = campoParaIso("2026-06-10T15:30");
  assert.equal(typeof iso, "string");
  assert.equal(isoParaCampo(iso as string), "2026-06-10T15:30");
  assert.equal(isoParaCampo(null), "");
  assert.equal(isoParaCampo("lixo"), "");
});

test("atividade: formulário vazio não passa; título curto, pontos fora da faixa e prazo ruim são recusados", () => {
  const v = validarAtividade({ ...formVazio(), titulo: "" });
  assert.equal(v.ok, false);
  for (const [campo, valor, chave] of [
    ["titulo", "A", "titulo"], ["pontos", "0", "pontos"], ["pontos", "101", "pontos"], ["pontos", "x", "pontos"], ["prazo", "ontem", "prazo"],
  ] as const) {
    const r = validarAtividade({ ...formVazio(), titulo: "Lista 1", [campo]: valor });
    assert.equal(r.ok, false, `${campo}=${valor}`);
    if (!r.ok) assert.ok(r.erros[chave]);
  }
});

test("atividade válida: normaliza título, pontos com vírgula e prazo vazio = null", () => {
  const r = validarAtividade({ ...formVazio(), titulo: "  Lista 1  ", pontos: "7,5", prazo: "" });
  assert.equal(r.ok, true);
  if (r.ok) {
    assert.equal(r.dados.titulo, "Lista 1");
    assert.equal(r.dados.pontos, 7.5);
    assert.equal(r.dados.prazo, null);
    assert.equal(r.dados.publicada, true);
  }
});

test("formDaAtividade devolve os dados do servidor ao formulário", () => {
  const f = formDaAtividade({ titulo: "T", instrucoes: "i", tipo: "avaliacao", prazo: null, pontos: 7.5, publicada: false });
  assert.deepEqual(f, { titulo: "T", instrucoes: "i", tipo: "avaliacao", prazo: "", pontos: "7,5", publicada: false });
});

test("turma: exige nome e disciplina", () => {
  assert.equal(validarTurma({ nome: "", disciplina: "Mat", anoLetivo: "", descricao: "" }).ok, false);
  assert.equal(validarTurma({ nome: "7º A", disciplina: "", anoLetivo: "", descricao: "" }).ok, false);
  const ok = validarTurma({ nome: " 7º A ", disciplina: " Mat ", anoLetivo: "2026", descricao: "" });
  assert.equal(ok.ok, true);
  if (ok.ok) assert.deepEqual(ok.dados, { nome: "7º A", disciplina: "Mat", anoLetivo: "2026", descricao: "" });
});

test("nota: 0 até o máximo, nunca acima, nunca negativa", () => {
  assert.deepEqual(validarNota("8,5", 10), { ok: true, nota: 8.5 });
  assert.deepEqual(validarNota("0", 10), { ok: true, nota: 0 });
  assert.deepEqual(validarNota("10", 10), { ok: true, nota: 10 });
  assert.equal(validarNota("10,01", 10).ok, false);
  assert.equal(validarNota("-1", 10).ok, false);
  assert.equal(validarNota("", 10).ok, false);
  assert.equal(validarNota("abc", 10).ok, false);
});

test("entregas: filtros e contagens", () => {
  const lista = [
    entrega({ alunoUid: "1" }),
    entrega({ alunoUid: "2", entregaId: "e2", status: "entregue" }),
    entrega({ alunoUid: "3", entregaId: "e3", status: "corrigida", corrigidaEm: "x", nota: 8 }),
  ];
  assert.deepEqual(contagemEntregas(lista), { todas: 3, aCorrigir: 1, corrigidas: 1, semEntrega: 1 });
  assert.deepEqual(filtrarEntregas(lista, "aCorrigir").map((e) => e.alunoUid), ["2"]);
  assert.deepEqual(filtrarEntregas(lista, "corrigidas").map((e) => e.alunoUid), ["3"]);
  assert.deepEqual(filtrarEntregas(lista, "semEntrega").map((e) => e.alunoUid), ["1"]);
  assert.equal(filtrarEntregas(lista, "todas").length, 3);
});

test("média da atividade só conta corrigidas; sem correção = null (nunca zero inventado)", () => {
  assert.equal(mediaDaAtividade([], 10), null);
  assert.equal(mediaDaAtividade([entrega({ entregaId: "e", status: "entregue" })], 10), null);
  const lista = [
    entrega({ entregaId: "a", corrigidaEm: "x", nota: 8 }),
    entrega({ entregaId: "b", corrigidaEm: "x", nota: 6 }),
    entrega({ entregaId: "c" }),
  ];
  assert.equal(mediaDaAtividade(lista, 10), 70);
  assert.equal(mediaDaAtividade(lista, 0), null);
});

test("textos", () => {
  assert.equal(fracao(2, 5), "2 de 5");
  assert.equal(fracao(0, 0), "Sem alunos");
  assert.equal(rotuloEntrega("entregue"), "Aguardando correção");
});
