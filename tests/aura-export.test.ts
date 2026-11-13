import test from "node:test";
import assert from "node:assert/strict";
import {
  markdownParaPdf, blocosDeMarkdown, trechosDeInline, separarGabarito, nomeDeArquivo, quebrarLinhas,
} from "../src/lib/aura-export.ts";
import { extrairPerguntas, interpretarPerguntas, montarRespostas } from "../src/lib/aura-perguntas.ts";

const texto = (u8: Uint8Array) => Buffer.from(u8).toString("latin1");

test("PDF tem cabeçalho, páginas, xref coerente e título", () => {
  const pdf = texto(markdownParaPdf("Prova de Física", "## Questões\n\n1) Quanto é 2+2?"));
  assert.ok(pdf.startsWith("%PDF-1.4"));
  assert.ok(pdf.trimEnd().endsWith("%%EOF"));
  assert.match(pdf, /\/Count 1/);
  assert.match(pdf, /Prova de F\\355sica/); // í em octal (WinAnsi)
  const xref = Number(/startxref\n(\d+)/.exec(pdf)![1]);
  assert.equal(pdf.slice(xref, xref + 4), "xref");
});

test("parênteses e barras são escapados e documentos longos paginam", () => {
  const pdf = texto(markdownParaPdf("T", "texto (com) \\ barra\n\n" + "linha longa de teste. ".repeat(1500)));
  assert.ok(pdf.includes("(\\(com\\)) Tj"));
  assert.ok(pdf.includes("(\\\\) Tj"));
  assert.ok(Number(/\/Count (\d+)/.exec(pdf)![1]) > 1);
});

test("caracteres fora do Windows-1252 não quebram o PDF", () => {
  const pdf = texto(markdownParaPdf("T", "emoji 😀 e chinês 中文 e seta →"));
  assert.ok(pdf.includes("%%EOF"));
});

test("markdown vira blocos: títulos, listas numeradas e com marcador, código, tabela", () => {
  const b = blocosDeMarkdown("# A\n- x\n1. y\n```\ncod\n```\n|a|b|\n|--|--|\n|1|2|\n---");
  assert.deepEqual(b.map((x) => x.tipo), ["titulo", "paragrafo", "paragrafo", "codigo", "paragrafo", "paragrafo", "linha"]);
});

test("inline: negrito preservado, itálico e links viram texto, snake_case intacto", () => {
  assert.deepEqual(trechosDeInline("a **b** *c* [d](http://x.y)"), [
    { texto: "a ", negrito: false }, { texto: "b", negrito: true }, { texto: " c d (http://x.y)", negrito: false },
  ]);
  assert.equal(trechosDeInline("nome_do_arquivo")[0].texto, "nome_do_arquivo");
});

test("quebra palavras maiores que a linha", () => {
  const linhas = quebrarLinhas([{ texto: "x".repeat(300), negrito: false }], 11, 200);
  assert.ok(linhas.length > 1);
});

test("separarGabarito divide questões e gabarito", () => {
  const r = separarGabarito("## Questões\n1) a\n\n---\n\n## Gabarito\n1) C");
  assert.equal(r.questoes, "## Questões\n1) a");
  assert.equal(r.gabarito, "## Gabarito\n1) C");
  assert.equal(separarGabarito("só texto").gabarito, null);
  assert.equal(separarGabarito("**Respostas:**\n1) A").gabarito, null); // nada antes: não separa
});

test("nomeDeArquivo remove acentos e símbolos", () => {
  assert.equal(nomeDeArquivo("Prova: Física / 2º Ano!", "pdf"), "prova-fisica-2-ano.pdf");
  assert.equal(nomeDeArquivo("???", "md"), "aura.md");
});

test("perguntas: extrai o bloco, limita e tolera JSON ruim", () => {
  const ok = extrairPerguntas('Antes de criar, preciso saber:\n```aura-perguntas\n[{"pergunta":"Série?","opcoes":["Médio","Superior"]},{"pergunta":"Quantas?","opcoes":[]}]\n```');
  assert.equal(ok.texto, "Antes de criar, preciso saber:");
  assert.equal(ok.perguntas.length, 2);
  assert.deepEqual(ok.perguntas[0].opcoes, ["Médio", "Superior"]);

  const ruim = extrairPerguntas("Oi\n```aura-perguntas\n{quebrado\n```");
  assert.equal(ruim.texto, "Oi");
  assert.deepEqual(ruim.perguntas, []);

  const aberto = extrairPerguntas("Oi\n```aura-perguntas\n[{\"pergunta\":\"Sé");
  assert.equal(aberto.texto, "Oi");

  assert.equal(interpretarPerguntas(JSON.stringify(Array(9).fill({ pergunta: "p", opcoes: Array(9).fill("o") }))).length, 4);
  assert.equal(interpretarPerguntas(JSON.stringify([{ pergunta: "p", opcoes: Array(9).fill("o") }]))[0].opcoes.length, 5);
  assert.deepEqual(extrairPerguntas("sem bloco").perguntas, []);
});

test("montarRespostas: junta as escolhas ou deixa a AURA decidir", () => {
  const ps = [{ pergunta: "Série?", opcoes: [] }, { pergunta: "Quantas?", opcoes: [] }];
  assert.equal(montarRespostas(ps, ["Médio", ""]), "1. Série? Médio");
  assert.match(montarRespostas(ps, ["", ""]), /Pode decidir você/);
});

test("perguntas: tolera ```json, aspas curvas e vírgula sobrando", () => {
  const a = extrairPerguntas('Preciso saber:\n```json\n[{"pergunta":"Série?","opcoes":["Médio",]}]\n```');
  assert.equal(a.perguntas.length, 1);
  assert.equal(a.texto, "Preciso saber:");
  const b = interpretarPerguntas("[{\u201cpergunta\u201d:\u201cSérie?\u201d,\u201copcoes\u201d:[\u201cMédio\u201d]}]");
  assert.deepEqual(b[0].opcoes, ["Médio"]);
});

test("perguntas: aceita o formato sem cerca que o modelo escreveu de verdade", () => {
  const bruto = 'Aura-perguntas [{"pergunta":"Para qual série?","opcoes":["Ensino Fundamental","Ensino Médio","Ensino Superior"]},{"pergunta":"Quantas questões?","opcoes":["5","10","15"]}]';
  const r = extrairPerguntas(bruto);
  assert.equal(r.perguntas.length, 2);
  assert.equal(r.perguntas[0].pergunta, "Para qual série?");
  assert.equal(r.texto, "");

  const comTexto = extrairPerguntas("Antes de criar, preciso saber:\n\nAura-perguntas:\n" + bruto.replace("Aura-perguntas ", "") + "\n\nObrigada!");
  assert.equal(comTexto.perguntas.length, 2);
  assert.ok(!/aura-perguntas/i.test(comTexto.texto));
  assert.ok(comTexto.texto.includes("preciso saber") && comTexto.texto.includes("Obrigada!"));
});

test("perguntas: colchetes comuns no texto não viram perguntas", () => {
  const r = extrairPerguntas('Veja [1] e [{"nome":"x"}] sem perguntas.');
  assert.deepEqual(r.perguntas, []);
  assert.equal(r.texto, 'Veja [1] e [{"nome":"x"}] sem perguntas.');
  const cerca = extrairPerguntas("Oi\n```aura-perguntas\n[{\"pergunta\":\"A?\",\"opcoes\":[]}]\n```");
  assert.equal(cerca.texto, "Oi");
});
