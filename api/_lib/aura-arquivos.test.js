import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { deflateRawSync, crc32 } from "node:zlib";
import { randomBytes } from "node:crypto";

process.env.DADOS_CHAVE_CRIPTO = randomBytes(32).toString("base64");
mock.module("./neon.js", { namedExports: { sql: async () => [] } });

const { extrairTextoOffice, ErroArquivo } = await import("./aura-arquivos.js");
const { extrairTextoArquivo } = await import("./aura-dados.js");

/** Monta um ZIP de verdade (com compactação ou sem) para os testes. */
function zip(arquivos, { comprimir = true, tamOrigMentira } = {}) {
  const locais = [];
  const centrais = [];
  let offset = 0;

  for (const [nome, conteudo] of Object.entries(arquivos)) {
    const bruto = Buffer.from(conteudo, "utf8");
    const dados = comprimir ? deflateRawSync(bruto) : bruto;
    const n = Buffer.from(nome);

    const loc = Buffer.alloc(30);
    loc.writeUInt32LE(0x04034b50, 0);
    loc.writeUInt16LE(20, 4);
    loc.writeUInt16LE(comprimir ? 8 : 0, 8);
    loc.writeUInt32LE(crc32(bruto), 14);
    loc.writeUInt32LE(dados.length, 18);
    loc.writeUInt32LE(bruto.length, 22);
    loc.writeUInt16LE(n.length, 26);
    locais.push(loc, n, dados);

    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(comprimir ? 8 : 0, 10);
    cen.writeUInt32LE(crc32(bruto), 16);
    cen.writeUInt32LE(dados.length, 20);
    cen.writeUInt32LE(tamOrigMentira ?? bruto.length, 24);
    cen.writeUInt16LE(n.length, 28);
    cen.writeUInt32LE(offset, 42);
    centrais.push(cen, n);

    offset += 30 + n.length + dados.length;
  }

  const cd = Buffer.concat(centrais);
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(Object.keys(arquivos).length, 8);
  fim.writeUInt16LE(Object.keys(arquivos).length, 10);
  fim.writeUInt32LE(cd.length, 12);
  fim.writeUInt32LE(offset, 16);

  return Buffer.concat([...locais, cd, fim]);
}

const DOCX = (corpo) => zip({ "word/document.xml": `<w:document><w:body>${corpo}</w:body></w:document>` });

test("docx: parágrafos, acentos, entidades e tabela", () => {
  const buf = DOCX(
    `<w:p><w:r><w:t>Plano de Aula: Frações</w:t></w:r></w:p>` +
      `<w:p><w:r><w:t xml:space="preserve">Ação &amp; reação &lt;ok&gt; &#233;</w:t></w:r><w:r><w:t> fim</w:t></w:r></w:p>` +
      `<w:tbl><w:tr><w:tc><w:p><w:r><w:t>Etapa</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>Tempo</w:t></w:r></w:p></w:tc></w:tr></w:tbl>`
  );
  const t = extrairTextoOffice(buf, "docx");
  assert.ok(t.includes("Plano de Aula: Frações"));
  assert.ok(t.includes("Ação & reação <ok> é fim"));
  assert.ok(t.includes("Etapa\tTempo"));
});

test("docx sem compactação (armazenado) também abre", () => {
  const buf = zip({ "word/document.xml": "<w:p><w:r><w:t>Olá</w:t></w:r></w:p>" }, { comprimir: false });
  assert.equal(extrairTextoOffice(buf, "docx"), "Olá");
});

test("pptx: slides em ordem numérica", () => {
  const buf = zip({
    "ppt/slides/slide10.xml": "<a:p><a:r><a:t>Dez</a:t></a:r></a:p>",
    "ppt/slides/slide2.xml": "<a:p><a:r><a:t>Dois</a:t></a:r></a:p>",
    "ppt/slides/slide1.xml": "<a:p><a:r><a:t>Um</a:t></a:r></a:p>",
  });
  const t = extrairTextoOffice(buf, "pptx");
  assert.ok(t.indexOf("Um") < t.indexOf("Dois") && t.indexOf("Dois") < t.indexOf("Dez"));
});

test("xlsx: textos compartilhados e números", () => {
  const buf = zip({
    "xl/sharedStrings.xml": "<sst><si><t>Aluno</t></si><si><t>Nota</t></si><si><t>Ana</t></si></sst>",
    "xl/worksheets/sheet1.xml":
      '<sheetData><row><c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c></row><row><c r="A2" t="s"><v>2</v></c><c r="B2"><v>9.5</v></c></row></sheetData>',
  });
  assert.equal(extrairTextoOffice(buf, "xlsx"), "## Planilha 1\nAluno\tNota\nAna\t9.5");
});

test("recusa: tipo errado, sem texto, corrompido e zip bomb", () => {
  assert.throws(() => extrairTextoOffice(zip({ "x.txt": "oi" }), "docx"), { codigo: "OFFICE_TIPO" });
  assert.throws(() => extrairTextoOffice(DOCX("<w:p></w:p>"), "docx"), { codigo: "SEM_TEXTO" });
  assert.throws(() => extrairTextoOffice(Buffer.from("PK\x03\x04 lixo lixo lixo lixo lixo lixo"), "docx"), { codigo: "ZIP_INVALIDO" });
  const bomba = zip({ "word/document.xml": "<w:t>a</w:t>" }, { tamOrigMentira: 500 * 1024 * 1024 });
  assert.throws(() => extrairTextoOffice(bomba, "docx"), (e) => e instanceof ErroArquivo && e.codigo === "ZIP_GRANDE");
});

test("extrairTextoArquivo: despacha por tipo e dá mensagem clara para formatos antigos", async () => {
  const docx = DOCX("<w:p><w:r><w:t>Conteúdo</w:t></w:r></w:p>").toString("base64");
  assert.equal((await extrairTextoArquivo(docx, "aula.docx")).texto, "Conteúdo");

  await assert.rejects(extrairTextoArquivo(docx, "aula.zip"), { codigo: "ARQUIVO_TIPO" });
  const antigo = Buffer.concat([Buffer.from("d0cf11e0", "hex"), Buffer.alloc(100)]).toString("base64");
  await assert.rejects(extrairTextoArquivo(antigo, "velho.doc"), { codigo: "ARQUIVO_ANTIGO" });
  await assert.rejects(extrairTextoArquivo(Buffer.from("texto puro").toString("base64"), "a.bin"), { codigo: "ARQUIVO_TIPO" });
  await assert.rejects(extrairTextoArquivo("", "a.docx"), { codigo: "ARQUIVO_VAZIO" });
});
