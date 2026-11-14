import { inflateRawSync } from "node:zlib";

/* Leitura de documentos do Office (.docx, .pptx, .xlsx) SEM bibliotecas externas.
   Esses formatos são arquivos ZIP com XML dentro: aqui lemos o ZIP (com defesas contra "zip bomb")
   e tiramos o texto do XML. Só texto: imagens, estilos e macros são ignorados. */

export class ErroArquivo extends Error {
  constructor(status, codigo, mensagem) {
    super(mensagem);
    this.status = status;
    this.codigo = codigo;
  }
}

const MAX_ENTRADAS = 3000;
const MAX_BYTES_ENTRADA = 20 * 1024 * 1024;
const MAX_BYTES_TOTAL = 40 * 1024 * 1024;
const MAX_CHARS_SAIDA = 200000;

/* ---------- ZIP ---------- */

function listarEntradas(buf) {
  const minimo = Math.max(0, buf.length - 65557);
  let eocd = -1;

  for (let i = buf.length - 22; i >= minimo; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }

  if (eocd < 0) throw new ErroArquivo(422, "ZIP_INVALIDO", "O arquivo está corrompido ou não é um documento válido.");

  const total = buf.readUInt16LE(eocd + 10);
  let pos = buf.readUInt32LE(eocd + 16);

  if (total > MAX_ENTRADAS) throw new ErroArquivo(422, "ZIP_GRANDE", "O documento tem arquivos internos demais.");

  const entradas = new Map();
  let somaBytes = 0;

  for (let n = 0; n < total; n++) {
    if (pos + 46 > buf.length || buf.readUInt32LE(pos) !== 0x02014b50) {
      throw new ErroArquivo(422, "ZIP_INVALIDO", "O arquivo está corrompido ou não é um documento válido.");
    }

    const metodo = buf.readUInt16LE(pos + 10);
    const tamComp = buf.readUInt32LE(pos + 20);
    const tamOrig = buf.readUInt32LE(pos + 24);
    const nomeLen = buf.readUInt16LE(pos + 28);
    const extraLen = buf.readUInt16LE(pos + 30);
    const comentLen = buf.readUInt16LE(pos + 32);
    const offsetLocal = buf.readUInt32LE(pos + 42);
    const nome = buf.toString("utf8", pos + 46, pos + 46 + nomeLen);

    somaBytes += tamOrig;

    if (somaBytes > MAX_BYTES_TOTAL) {
      throw new ErroArquivo(422, "ZIP_GRANDE", "O documento é grande demais depois de aberto.");
    }

    entradas.set(nome, { metodo, tamComp, tamOrig, offsetLocal });
    pos += 46 + nomeLen + extraLen + comentLen;
  }

  return entradas;
}

function lerEntrada(buf, entrada) {
  if (entrada.tamOrig > MAX_BYTES_ENTRADA) {
    throw new ErroArquivo(422, "ZIP_GRANDE", "Uma parte do documento é grande demais.");
  }

  const o = entrada.offsetLocal;

  if (o + 30 > buf.length || buf.readUInt32LE(o) !== 0x04034b50) {
    throw new ErroArquivo(422, "ZIP_INVALIDO", "O arquivo está corrompido ou não é um documento válido.");
  }

  const inicio = o + 30 + buf.readUInt16LE(o + 26) + buf.readUInt16LE(o + 28);
  const dados = buf.subarray(inicio, inicio + entrada.tamComp);

  if (entrada.metodo === 0) return dados;

  if (entrada.metodo === 8) {
    try {
      return inflateRawSync(dados, { maxOutputLength: MAX_BYTES_ENTRADA });
    } catch {
      throw new ErroArquivo(422, "ZIP_INVALIDO", "O arquivo está corrompido ou não é um documento válido.");
    }
  }

  throw new ErroArquivo(415, "ZIP_METODO", "Este documento usa uma compactação que não consigo abrir.");
}

/* ---------- XML → texto ---------- */

const ENTIDADES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" };

function decodificar(texto) {
  return texto.replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (_, e) => {
    if (e[0] === "#") {
      const codigo = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return codigo > 0 && codigo < 0x110000 ? String.fromCodePoint(codigo) : "";
    }
    return ENTIDADES[e.toLowerCase()] ?? "";
  });
}

function textosDe(xml, tag) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "g");
  const saida = [];
  let m;
  while ((m = re.exec(xml))) saida.push(decodificar(m[1]));
  return saida;
}

function limparLinhas(texto) {
  return texto
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function textoDocx(xml) {
  const corpo = xml
    .replace(/<w:tab\s*\/>/g, "\t")
    .replace(/<w:(?:br|cr)\s*\/>/g, "\n")
    .replace(/<\/w:p>\s*<\/w:tc>/g, "\t")
    .replace(/<\/w:tc>/g, "\t")
    .replace(/<\/w:tr>/g, "\n")
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g, (_, t) => `\u0001${t}\u0002`);

  const partes = [];
  let m;
  const re = /([^\u0001\u0002]*)\u0001([\s\S]*?)\u0002/g;
  let ultimo = 0;

  while ((m = re.exec(corpo))) {
    partes.push(m[1].replace(/<[^>]*>/g, ""));
    partes.push(decodificar(m[2]));
    ultimo = re.lastIndex;
  }

  partes.push(corpo.slice(ultimo).replace(/<[^>]*>/g, ""));

  return limparLinhas(partes.join(""));
}

function ordemNumerica(a, b) {
  return Number(/(\d+)\.xml$/.exec(a)?.[1] ?? 0) - Number(/(\d+)\.xml$/.exec(b)?.[1] ?? 0);
}

function textoPptx(buf, entradas) {
  const slides = [...entradas.keys()].filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort(ordemNumerica);
  const blocos = [];

  slides.forEach((nome, i) => {
    const xml = lerEntrada(buf, entradas.get(nome)).toString("utf8");
    const paragrafos = xml
      .split(/<\/a:p>/)
      .map((p) => textosDe(p, "a:t").join(""))
      .filter((p) => p.trim());

    blocos.push(`## Slide ${i + 1}\n${paragrafos.join("\n")}`);
  });

  return limparLinhas(blocos.join("\n\n"));
}

function textoXlsx(buf, entradas) {
  const compartilhadas = [];

  if (entradas.has("xl/sharedStrings.xml")) {
    const xml = lerEntrada(buf, entradas.get("xl/sharedStrings.xml")).toString("utf8");
    for (const si of xml.split(/<\/si>/)) {
      if (/<si[\s>]/.test(si)) compartilhadas.push(textosDe(si, "t").join(""));
    }
  }

  const planilhas = [...entradas.keys()].filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort(ordemNumerica);
  const blocos = [];

  planilhas.forEach((nome, i) => {
    const xml = lerEntrada(buf, entradas.get(nome)).toString("utf8");
    const linhas = [];

    for (const linha of xml.split(/<\/row>/)) {
      const celulas = [];
      const re = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
      let m;

      while ((m = re.exec(linha))) {
        const tipo = /\bt="([^"]*)"/.exec(m[1])?.[1];
        const corpo = m[2] || "";
        const v = /<v>([\s\S]*?)<\/v>/.exec(corpo)?.[1];

        if (tipo === "s" && v !== undefined) celulas.push(compartilhadas[Number(v)] ?? "");
        else if (tipo === "inlineStr") celulas.push(textosDe(corpo, "t").join(""));
        else if (v !== undefined) celulas.push(decodificar(v));
        else celulas.push("");
      }

      if (celulas.some((c) => c !== "")) linhas.push(celulas.join("\t"));
      if (linhas.length >= 2000) break;
    }

    blocos.push(`## Planilha ${i + 1}\n${linhas.join("\n")}`);
  });

  return limparLinhas(blocos.join("\n\n"));
}

/** tipo: "docx" | "pptx" | "xlsx". Devolve o texto do documento. */
export function extrairTextoOffice(buffer, tipo) {
  const entradas = listarEntradas(buffer);
  let texto = "";

  if (tipo === "docx") {
    const principal = entradas.get("word/document.xml");
    if (!principal) throw new ErroArquivo(415, "OFFICE_TIPO", "Este arquivo não parece ser um documento do Word (.docx).");
    texto = textoDocx(lerEntrada(buffer, principal).toString("utf8"));
  } else if (tipo === "pptx") {
    if (![...entradas.keys()].some((n) => n.startsWith("ppt/slides/"))) {
      throw new ErroArquivo(415, "OFFICE_TIPO", "Este arquivo não parece ser uma apresentação (.pptx).");
    }
    texto = textoPptx(buffer, entradas);
  } else if (tipo === "xlsx") {
    if (![...entradas.keys()].some((n) => n.startsWith("xl/worksheets/"))) {
      throw new ErroArquivo(415, "OFFICE_TIPO", "Este arquivo não parece ser uma planilha (.xlsx).");
    }
    texto = textoXlsx(buffer, entradas);
  } else {
    throw new ErroArquivo(415, "OFFICE_TIPO", "Tipo de documento não suportado.");
  }

  if (!texto) throw new ErroArquivo(422, "SEM_TEXTO", "Não encontrei texto neste documento.");

  return texto.slice(0, MAX_CHARS_SAIDA);
}
