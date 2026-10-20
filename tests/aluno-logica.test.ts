import test from "node:test";
import assert from "node:assert/strict";
import {
  diasAteOPrazo, textoDoPrazo, percentual, textoDaNota, faixaDeDesempenho, aFazer, contagemPorStatus,
  filtrar, agruparPorDia, tituloDoDia, saudacao, primeiroNome, normalizarCodigo,
} from "../src/dashboard/aluno/logica.ts";

const agora = new Date(2026, 5, 10, 15, 0); // 10/06/2026 15:00 local
const iso = (d: number, h = 12) => new Date(2026, 5, d, h).toISOString();
const ativ = (id: string, status: any, prazo: string | null, extra: object = {}) => ({
  id, titulo: `T${id}`, tipo: "atividade", prazo, pontos: 10, turmaId: "t", turma: "7º A",
  disciplina: "Matemática", enviadaEm: null, nota: null, corrigidaEm: null, status, ...extra,
}) as any;

test("dias até o prazo conta dias de calendário, não horas", () => {
  assert.equal(diasAteOPrazo(iso(10, 23), agora), 0);
  assert.equal(diasAteOPrazo(iso(11, 1), agora), 1);
  assert.equal(diasAteOPrazo(iso(8), agora), -2);
  assert.equal(diasAteOPrazo(null, agora), null);
  assert.equal(diasAteOPrazo("lixo", agora), null);
});
test("texto do prazo", () => {
  assert.equal(textoDoPrazo(null, agora), "Sem prazo");
  assert.equal(textoDoPrazo(iso(10), agora), "Vence hoje");
  assert.equal(textoDoPrazo(iso(11), agora), "Vence amanhã");
  assert.equal(textoDoPrazo(iso(15), agora), "Vence em 5 dias");
  assert.equal(textoDoPrazo(iso(9), agora), "Venceu ontem");
  assert.equal(textoDoPrazo(iso(5), agora), "Venceu há 5 dias");
});
test("percentual nunca inventa valor", () => {
  assert.equal(percentual(1, 0), null);
  assert.equal(percentual(NaN, 3), null);
  assert.equal(percentual(1, 3), 33);
  assert.equal(percentual(5, 3), 100);
  assert.equal(percentual(-1, 3), 0);
});
test("nota e faixa", () => {
  assert.equal(textoDaNota(null, 10), "Sem nota");
  assert.equal(textoDaNota(8.5, 10), "8,5 / 10");
  assert.equal(textoDaNota(7, 10), "7 / 10");
  assert.equal(faixaDeDesempenho(null), null);
  assert.equal(faixaDeDesempenho(70), "alto");
  assert.equal(faixaDeDesempenho(50), "medio");
  assert.equal(faixaDeDesempenho(49), "baixo");
});
test("a fazer: só pendente/atrasada, prazo mais próximo primeiro, sem prazo por último", () => {
  const l = [ativ("1", "pendente", null), ativ("2", "entregue", iso(1)), ativ("3", "atrasada", iso(5)), ativ("4", "pendente", iso(12))];
  assert.deepEqual(aFazer(l).map((a) => a.id), ["3", "4", "1"]);
});
test("contagem por status", () => {
  const c = contagemPorStatus([ativ("1", "pendente", null), ativ("2", "pendente", null), ativ("3", "corrigida", null)]);
  assert.deepEqual(c, { pendente: 2, atrasada: 0, entregue: 0, corrigida: 1 });
});
test("filtro por status e busca (sem acento obrigatório de caixa)", () => {
  const l = [ativ("1", "pendente", iso(12), { titulo: "Frações" }), ativ("2", "entregue", iso(11), { disciplina: "História" })];
  assert.deepEqual(filtrar(l, "todas", "").map((a) => a.id), ["2", "1"]);
  assert.deepEqual(filtrar(l, "pendente", "").map((a) => a.id), ["1"]);
  assert.deepEqual(filtrar(l, "todas", "FRAÇÕES").map((a) => a.id), ["1"]);
  assert.deepEqual(filtrar(l, "todas", "história").map((a) => a.id), ["2"]);
  assert.deepEqual(filtrar(l, "corrigida", ""), []);
});
test("agenda agrupa por dia e ignora quem não tem prazo", () => {
  const g = agruparPorDia([ativ("1", "pendente", iso(12, 9)), ativ("2", "pendente", iso(12, 18)), ativ("3", "pendente", iso(11)), ativ("4", "pendente", null)]);
  assert.deepEqual(g.map((x) => [x.dia, x.itens.length]), [["2026-06-11", 1], ["2026-06-12", 2]]);
});
test("título do dia", () => {
  assert.match(tituloDoDia("2026-06-10", agora), /^Hoje · /);
  assert.match(tituloDoDia("2026-06-11", agora), /^Amanhã · /);
  assert.match(tituloDoDia("2026-06-20", agora), /^[A-ZÀ-Ú]/);
});
test("saudação e primeiro nome", () => {
  assert.equal(saudacao(new Date(2026, 0, 1, 8)), "Bom dia");
  assert.equal(saudacao(new Date(2026, 0, 1, 14)), "Boa tarde");
  assert.equal(saudacao(new Date(2026, 0, 1, 21)), "Boa noite");
  assert.equal(primeiroNome("maria souza"), "Maria");
  assert.equal(primeiroNome(null, "joao.silva@x.com"), "Joao.silva");
  assert.equal(primeiroNome("", ""), "Aluno");
});
test("código de turma", () => {
  assert.equal(normalizarCodigo(" ab-c 12$"), "ABC12");
  assert.equal(normalizarCodigo("a".repeat(30)).length, 12);
});
