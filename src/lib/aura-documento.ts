/* Detecta quando uma resposta da AURA é um documento criado (prova, plano de aula, material...)
   para mostrar o cartão "Visualizar / Baixar". Respostas comuns de conversa não ganham cartão. */

export type TipoDocumento = "prova" | "exercicios" | "plano" | "material" | "documento";

export interface DocumentoDetectado {
  titulo: string;
  tipo: TipoDocumento;
  temGabarito: boolean;
}

const ROTULOS: Record<TipoDocumento, string> = {
  prova: "Prova",
  exercicios: "Lista de exercícios",
  plano: "Plano de aula",
  material: "Material de estudo",
  documento: "Documento",
};

export function rotuloDoTipo(tipo: TipoDocumento): string {
  return ROTULOS[tipo];
}

function tituloDe(markdown: string): string {
  const m = markdown.match(/^\s{0,3}#{1,3}\s+(.+?)\s*#*\s*$/m);
  return (m?.[1] || "").replace(/[*_`]/g, "").trim();
}

export function detectarDocumento(markdown: string): DocumentoDetectado | null {
  const texto = (markdown || "").replace(/\r\n/g, "\n");
  if (texto.length < 400) return null;

  const titulo = tituloDe(texto);
  const temGabarito = /^\s*(#{1,6}\s*|\*\*)\s*(gabarito|respostas?|resolu[cç][aã]o)\b/im.test(texto);
  const questoes = (texto.match(/^\s*(?:#{1,6}\s*)?(?:\*\*)?(?:quest[aã]o\s*)?\d{1,2}\s*[.)\-:]/gim) || []).length;
  const alternativas = (texto.match(/^\s*(?:[-*]\s*)?\(?[a-e]\)\s+\S/gim) || []).length;
  const alvo = `${titulo}\n${texto.slice(0, 300)}`.toLowerCase();

  if (!titulo) return null;

  let tipo: TipoDocumento | null = null;

  if (/\b(prova|avalia[cç][aã]o|simulado|teste)\b/.test(alvo) && questoes >= 2) tipo = "prova";
  else if (/\b(lista de exerc[ií]cios|exerc[ií]cios|atividade|question[aá]rio)\b/.test(alvo) && questoes >= 2) tipo = "exercicios";
  else if (/\bplano de aula\b|\bplano de ensino\b|\bsequ[eê]ncia did[aá]tica\b/.test(alvo)) tipo = "plano";
  else if (/\b(material|apostila|resumo|roteiro|guia de estudo|ficha|cronograma|checklist)\b/.test(alvo) && texto.length >= 700) tipo = "material";
  else if (temGabarito && questoes >= 3) tipo = "prova";
  else if (questoes >= 5 && alternativas >= 8) tipo = "prova";

  if (!tipo) return null;

  return { titulo, tipo, temGabarito };
}
