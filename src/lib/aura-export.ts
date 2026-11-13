/* Exportação da AURA: PDF (gerado aqui, sem bibliotecas) e Markdown.
   O PDF usa as fontes padrão Helvetica (que todo leitor de PDF tem) com acentuação do português.
   Larguras das fontes: métricas oficiais Helvetica/Helvetica-Bold (unidades de 1/1000 do corpo),
   para os caracteres 32 a 255 da codificação WinAnsi (Windows-1252). */

const LARGURA_REGULAR: number[] = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556,
  1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556,
  333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556,
  556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584, 761,
  556, 0, 222, 556, 333, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0,
  0, 222, 222, 333, 333, 350, 556, 1000, 333, 1000, 500, 333, 944, 0, 500, 667,
  278, 333, 556, 556, 556, 556, 260, 556, 333, 737, 370, 556, 584, 333, 737, 333,
  400, 584, 333, 333, 333, 556, 537, 278, 333, 333, 365, 556, 834, 834, 834, 611,
  667, 667, 667, 667, 667, 667, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278,
  722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611,
  556, 556, 556, 556, 556, 556, 889, 500, 556, 556, 556, 556, 278, 278, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 584, 611, 556, 556, 556, 556, 500, 556, 500,
];

const LARGURA_NEGRITO: number[] = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611,
  975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778,
  667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556,
  333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611,
  611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584, 761,
  556, 0, 278, 556, 500, 1000, 556, 556, 333, 1000, 667, 333, 1000, 0, 611, 0,
  0, 278, 278, 500, 500, 350, 556, 1000, 333, 1000, 556, 333, 944, 0, 500, 667,
  278, 333, 556, 556, 556, 556, 280, 556, 333, 737, 370, 556, 584, 333, 737, 333,
  400, 584, 333, 333, 333, 611, 556, 278, 333, 333, 365, 556, 834, 834, 834, 611,
  722, 722, 722, 722, 722, 722, 1000, 722, 667, 667, 667, 667, 278, 278, 278, 278,
  722, 722, 778, 778, 778, 778, 778, 584, 778, 722, 722, 722, 722, 667, 667, 611,
  556, 556, 556, 556, 556, 556, 889, 556, 556, 556, 556, 556, 278, 278, 278, 278,
  611, 611, 611, 611, 611, 611, 611, 584, 611, 611, 611, 611, 611, 556, 611, 556,
];

/* Caracteres fora do Latin-1 que existem no Windows-1252. */
const CP1252_EXTRAS: Record<number, number> = {
  0x20ac: 128, 0x201a: 130, 0x0192: 131, 0x201e: 132, 0x2026: 133, 0x2020: 134,
  0x2021: 135, 0x02c6: 136, 0x2030: 137, 0x0160: 138, 0x2039: 139, 0x0152: 140,
  0x017d: 142, 0x2018: 145, 0x2019: 146, 0x201c: 147, 0x201d: 148, 0x2022: 149,
  0x2013: 150, 0x2014: 151, 0x02dc: 152, 0x2122: 153, 0x0161: 154, 0x203a: 155,
  0x0153: 156, 0x017e: 158, 0x0178: 159,
};

/** Converte um caractere para o byte WinAnsi (ou "?" se não existir). */
function paraByte(caractere: string): number {
  const c = caractere.codePointAt(0) ?? 63;

  if (c === 9) return 32;
  if (c >= 32 && c <= 126) return c;
  if (c >= 160 && c <= 255) return c;
  if (CP1252_EXTRAS[c] !== undefined) return CP1252_EXTRAS[c];
  if (c === 0x2192) return 62; // →
  if (c === 0x2212) return 45; // −
  if (c === 0x00a0) return 32;
  return 63;
}

function larguraDoByte(byte: number, negrito: boolean): number {
  const i = byte - 32;
  const tabela = negrito ? LARGURA_NEGRITO : LARGURA_REGULAR;
  return i >= 0 && i < tabela.length ? tabela[i] : 556;
}

function larguraTexto(texto: string, corpo: number, negrito: boolean): number {
  let total = 0;

  for (const ch of texto) total += larguraDoByte(paraByte(ch), negrito);

  return (total * corpo) / 1000;
}

function escaparPdf(texto: string): string {
  let saida = "";

  for (const ch of texto) {
    const b = paraByte(ch);
    const c = String.fromCharCode(b);

    if (c === "\\" || c === "(" || c === ")") saida += "\\" + c;
    else if (b > 126) saida += "\\" + b.toString(8).padStart(3, "0");
    else saida += c;
  }

  return saida;
}

/* ---------- Markdown → blocos ---------- */

interface Trecho {
  texto: string;
  negrito: boolean;
}

type Bloco =
  | { tipo: "titulo"; nivel: 1 | 2 | 3; trechos: Trecho[] }
  | { tipo: "paragrafo"; trechos: Trecho[]; recuo: number; marcador?: string }
  | { tipo: "codigo"; linhas: string[] }
  | { tipo: "linha" }
  | { tipo: "espaco" };

/** **negrito** vira negrito; itálico, `código` e links viram texto simples. */
export function trechosDeInline(texto: string): Trecho[] {
  const limpo = texto
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*(?!\*)/g, "$1$2")
    .replace(/(^|[^\w])_([^_\s][^_]*)_(?!\w)/g, "$1$2");

  const trechos: Trecho[] = [];
  const partes = limpo.split(/(\*\*[^*]+\*\*)/g);

  for (const parte of partes) {
    if (!parte) continue;

    if (parte.startsWith("**") && parte.endsWith("**") && parte.length > 4) {
      trechos.push({ texto: parte.slice(2, -2), negrito: true });
    } else {
      trechos.push({ texto: parte.replace(/\*\*/g, ""), negrito: false });
    }
  }

  return trechos;
}

export function blocosDeMarkdown(markdown: string): Bloco[] {
  const blocos: Bloco[] = [];
  const linhas = markdown.replace(/\r\n/g, "\n").split("\n");

  let codigo: string[] | null = null;

  for (const bruta of linhas) {
    const linha = bruta.replace(/\s+$/g, "");

    if (/^```/.test(linha.trim())) {
      if (codigo) {
        blocos.push({ tipo: "codigo", linhas: codigo });
        codigo = null;
      } else {
        codigo = [];
      }
      continue;
    }

    if (codigo) {
      codigo.push(linha);
      continue;
    }

    if (!linha.trim()) {
      blocos.push({ tipo: "espaco" });
      continue;
    }

    const titulo = /^(#{1,6})\s+(.*)$/.exec(linha);
    if (titulo) {
      const nivel = Math.min(titulo[1].length, 3) as 1 | 2 | 3;
      blocos.push({ tipo: "titulo", nivel, trechos: trechosDeInline(titulo[2]).map((t) => ({ ...t, negrito: true })) });
      continue;
    }

    if (/^\s*([-*_])\s*(\1\s*){2,}$/.test(linha)) {
      blocos.push({ tipo: "linha" });
      continue;
    }

    if (/^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(linha)) continue; // separador de tabela

    if (/^\s*\|.*\|\s*$/.test(linha)) {
      const celulas = linha.trim().replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      blocos.push({ tipo: "paragrafo", trechos: trechosDeInline(celulas.join("  |  ")), recuo: 0 });
      continue;
    }

    const lista = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/.exec(linha);
    if (lista) {
      const nivel = Math.min(Math.floor(lista[1].replace(/\t/g, "  ").length / 2), 3);
      const numerada = /\d/.test(lista[2]);
      blocos.push({
        tipo: "paragrafo",
        trechos: trechosDeInline(lista[3]),
        recuo: 14 + nivel * 14,
        marcador: numerada ? lista[2] : "\u2022",
      });
      continue;
    }

    const citacao = /^>\s?(.*)$/.exec(linha);
    if (citacao) {
      blocos.push({ tipo: "paragrafo", trechos: trechosDeInline(citacao[1]), recuo: 14 });
      continue;
    }

    blocos.push({ tipo: "paragrafo", trechos: trechosDeInline(linha.trim()), recuo: 0 });
  }

  if (codigo) blocos.push({ tipo: "codigo", linhas: codigo });

  return blocos;
}

/* ---------- layout e PDF ---------- */

const PAGINA_L = 595.28;
const PAGINA_A = 841.89;
const MARGEM = 56;
const RODAPE = 40;
const CORPO = 11;
const ENTRELINHA = 1.38;

interface Palavra {
  texto: string;
  negrito: boolean;
}

function palavrasDe(trechos: Trecho[]): Palavra[] {
  const palavras: Palavra[] = [];

  for (const t of trechos) {
    for (const p of t.texto.split(/\s+/)) {
      if (p) palavras.push({ texto: p, negrito: t.negrito });
    }
  }

  return palavras;
}

/** Quebra em linhas que cabem na largura. Palavras maiores que a linha são partidas. */
export function quebrarLinhas(palavras: Palavra[], corpo: number, largura: number): Palavra[][] {
  const linhas: Palavra[][] = [];
  let atual: Palavra[] = [];
  let usado = 0;
  const espaco = larguraTexto(" ", corpo, false);

  const empurrar = (p: Palavra) => {
    const w = larguraTexto(p.texto, corpo, p.negrito);
    const extra = atual.length ? espaco : 0;

    if (usado + extra + w <= largura) {
      atual.push(p);
      usado += extra + w;
      return;
    }

    if (atual.length) {
      linhas.push(atual);
      atual = [];
      usado = 0;
    }

    if (w <= largura) {
      atual.push(p);
      usado = w;
      return;
    }

    let resto = Array.from(p.texto);
    while (resto.length) {
      let n = 1;
      while (n < resto.length && larguraTexto(resto.slice(0, n + 1).join(""), corpo, p.negrito) <= largura) n++;
      const pedaco = resto.slice(0, n).join("");
      resto = resto.slice(n);
      if (resto.length) linhas.push([{ texto: pedaco, negrito: p.negrito }]);
      else {
        atual = [{ texto: pedaco, negrito: p.negrito }];
        usado = larguraTexto(pedaco, corpo, p.negrito);
      }
    }
  };

  for (const p of palavras) empurrar(p);
  if (atual.length) linhas.push(atual);

  return linhas;
}

interface Pagina {
  comandos: string[];
}

/** Gera os bytes de um PDF (A4) a partir de Markdown. */
export function markdownParaPdf(titulo: string, markdown: string): Uint8Array {
  const paginas: Pagina[] = [{ comandos: [] }];
  let y = MARGEM; // distância do topo

  const novaPagina = () => {
    paginas.push({ comandos: [] });
    y = MARGEM;
  };

  const garantir = (altura: number) => {
    if (y + altura > PAGINA_A - RODAPE - 10) novaPagina();
  };

  const texto = (x: number, yTopo: number, fonte: "F1" | "F2" | "F3", corpo: number, conteudo: string) => {
    const base = PAGINA_A - yTopo - corpo * 0.8;
    paginas[paginas.length - 1].comandos.push(
      `BT /${fonte} ${corpo} Tf ${x.toFixed(2)} ${base.toFixed(2)} Td (${escaparPdf(conteudo)}) Tj ET`
    );
  };

  const desenharLinha = (palavras: Palavra[], x: number, corpo: number) => {
    let cursor = x;
    const espaco = larguraTexto(" ", corpo, false);

    palavras.forEach((p, i) => {
      texto(cursor, y, p.negrito ? "F2" : "F1", corpo, p.texto);
      cursor += larguraTexto(p.texto, corpo, p.negrito) + (i < palavras.length - 1 ? espaco : 0);
    });
  };

  const larguraUtil = PAGINA_L - MARGEM * 2;

  // Título do documento
  const linhasTitulo = quebrarLinhas(palavrasDe([{ texto: titulo || "Documento", negrito: true }]), 20, larguraUtil);
  for (const l of linhasTitulo) {
    garantir(26);
    desenharLinha(l, MARGEM, 20);
    y += 26;
  }
  paginas[0].comandos.push(
    `0.55 0.36 0.84 RG 1.2 w ${MARGEM} ${(PAGINA_A - y + 6).toFixed(2)} m ${PAGINA_L - MARGEM} ${(PAGINA_A - y + 6).toFixed(2)} l S`
  );
  y += 16;

  for (const bloco of blocosDeMarkdown(markdown)) {
    if (bloco.tipo === "espaco") {
      y += 5;
      continue;
    }

    if (bloco.tipo === "linha") {
      garantir(14);
      paginas[paginas.length - 1].comandos.push(
        `0.7 0.7 0.7 RG 0.6 w ${MARGEM} ${(PAGINA_A - y - 6).toFixed(2)} m ${PAGINA_L - MARGEM} ${(PAGINA_A - y - 6).toFixed(2)} l S`
      );
      y += 14;
      continue;
    }

    if (bloco.tipo === "codigo") {
      for (const l of bloco.linhas) {
        garantir(12);
        // Courier: largura fixa de 600/1000 do corpo
        const max = Math.max(1, Math.floor(larguraUtil / (9 * 0.6)) - 2);
        const partes = l.length ? l.match(new RegExp(".{1," + max + "}", "g")) || [""] : [""];
        for (const parte of partes) {
          garantir(12);
          texto(MARGEM + 8, y, "F3", 9, parte);
          y += 12;
        }
      }
      y += 4;
      continue;
    }

    if (bloco.tipo === "titulo") {
      const corpo = bloco.nivel === 1 ? 16 : bloco.nivel === 2 ? 13.5 : 12;
      y += bloco.nivel === 1 ? 8 : 5;

      for (const l of quebrarLinhas(palavrasDe(bloco.trechos), corpo, larguraUtil)) {
        garantir(corpo * ENTRELINHA + 6);
        desenharLinha(l, MARGEM, corpo);
        y += corpo * ENTRELINHA;
      }
      y += 3;
      continue;
    }

    const x = MARGEM + bloco.recuo;
    const linhas = quebrarLinhas(palavrasDe(bloco.trechos), CORPO, larguraUtil - bloco.recuo);

    linhas.forEach((l, i) => {
      garantir(CORPO * ENTRELINHA);
      if (i === 0 && bloco.marcador) {
        texto(x - larguraTexto(bloco.marcador, CORPO, false) - 4, y, "F1", CORPO, bloco.marcador);
      }
      desenharLinha(l, x, CORPO);
      y += CORPO * ENTRELINHA;
    });
  }

  // Rodapé e paginação
  const total = paginas.length;
  paginas.forEach((p, i) => {
    const rodape = `Gerado pela AURA \u2022 EducaCube \u2022 p\u00e1gina ${i + 1} de ${total}`;
    const w = larguraTexto(rodape, 8, false);
    p.comandos.push(
      `BT /F1 8 Tf 0.45 g ${(PAGINA_L / 2 - w / 2).toFixed(2)} ${(RODAPE - 6).toFixed(2)} Td (${escaparPdf(rodape)}) Tj ET`
    );
  });

  return montarPdf(paginas, titulo);
}

function montarPdf(paginas: Pagina[], titulo: string): Uint8Array {

  // 1 catálogo, 2 páginas, 3-5 fontes; depois (conteúdo, página) para cada página
  const idsPagina: number[] = [];
  const corpos: string[] = [];

  paginas.forEach((p, i) => {
    const idConteudo = 6 + i * 2;
    const idPagina = 7 + i * 2;
    const fluxo = p.comandos.join("\n");

    corpos[idConteudo] = `<< /Length ${fluxo.length} >>\nstream\n${fluxo}\nendstream`;
    corpos[idPagina] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGINA_L} ${PAGINA_A}] ` +
      `/Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${idConteudo} 0 R >>`;
    idsPagina.push(idPagina);
  });

  corpos[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  corpos[2] = `<< /Type /Pages /Kids [${idsPagina.map((i) => `${i} 0 R`).join(" ")}] /Count ${idsPagina.length} >>`;
  corpos[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>";
  corpos[4] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>";
  corpos[5] = "<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>";

  const ultimo = 6 + paginas.length * 2 - 1;
  corpos[ultimo + 1] = `<< /Title (${escaparPdf(titulo)}) /Producer (AURA EducaCube) >>`;

  let saida = "%PDF-1.4\n";
  const posicoes: number[] = [];

  for (let id = 1; id <= ultimo + 1; id++) {
    posicoes[id] = saida.length;
    saida += `${id} 0 obj\n${corpos[id]}\nendobj\n`;
  }

  const xref = saida.length;
  saida += `xref\n0 ${ultimo + 2}\n0000000000 65535 f \n`;
  for (let id = 1; id <= ultimo + 1; id++) {
    saida += `${String(posicoes[id]).padStart(10, "0")} 00000 n \n`;
  }
  saida += `trailer\n<< /Size ${ultimo + 2} /Root 1 0 R /Info ${ultimo + 1} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

  // Todo o conteúdo é ASCII (acentos saem como escapes octais), então 1 char = 1 byte.
  const bytes = new Uint8Array(saida.length);
  for (let i = 0; i < saida.length; i++) bytes[i] = saida.charCodeAt(i) & 0xff;

  return bytes;
}

/* ---------- gabarito, nomes e downloads ---------- */

/** Separa o que vem a partir do título "Gabarito" (ou "Respostas"). Sem gabarito, gabarito = null. */
export function separarGabarito(markdown: string): { questoes: string; gabarito: string | null } {
  const linhas = markdown.replace(/\r\n/g, "\n").split("\n");
  const i = linhas.findIndex((l) =>
    /^\s*(#{1,6}\s*|\*\*)\s*(gabarito|respostas?|resolu[cç][aã]o)\b/i.test(l)
  );

  if (i <= 0) return { questoes: markdown.trim(), gabarito: null };

  const questoes = linhas.slice(0, i).join("\n").replace(/\n-{3,}\s*$/g, "").trim();

  return questoes ? { questoes, gabarito: linhas.slice(i).join("\n").trim() } : { questoes: markdown.trim(), gabarito: null };
}

export function nomeDeArquivo(titulo: string, extensao: string): string {
  const base = titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 60);

  return `${base || "aura"}.${extensao}`;
}

function baixar(nome: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function baixarPdf(titulo: string, markdown: string, sufixo = "") {
  const bytes = markdownParaPdf(titulo, markdown);
  baixar(nomeDeArquivo(titulo + sufixo, "pdf"), new Blob([bytes as BlobPart], { type: "application/pdf" }));
}

export function baixarMarkdown(titulo: string, markdown: string) {
  baixar(nomeDeArquivo(titulo, "md"), new Blob([`# ${titulo}\n\n${markdown}\n`], { type: "text/markdown;charset=utf-8" }));
}
