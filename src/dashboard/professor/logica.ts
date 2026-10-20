import type { AtividadeProfessor, DadosAtividade, EntregaProfessor, StatusEntrega, TipoAtividade } from "../../lib/api-plataforma";

/* Regras puras do painel do professor (sem React, sem rede) — testadas em tests/professor-logica.test.ts. */

export type FormAtividade = {
  titulo: string;
  instrucoes: string;
  tipo: TipoAtividade;
  prazo: string; // valor de <input type="datetime-local"> ("" = sem prazo)
  pontos: string; // texto digitado (aceita vírgula)
  publicada: boolean;
};

export const formVazio = (): FormAtividade => ({
  titulo: "",
  instrucoes: "",
  tipo: "atividade",
  prazo: "",
  pontos: "10",
  publicada: true,
});

const doisDigitos = (n: number) => String(n).padStart(2, "0");

/** ISO do servidor -> "AAAA-MM-DDTHH:mm" no fuso local (formato do datetime-local). */
export function isoParaCampo(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}T${doisDigitos(d.getHours())}:${doisDigitos(d.getMinutes())}`;
}

/** "AAAA-MM-DDTHH:mm" local -> ISO UTC; "" -> null; inválido -> undefined. */
export function campoParaIso(valor: string): string | null | undefined {
  if (!valor) return null;
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export const formDaAtividade = (a: { titulo: string; instrucoes: string; tipo: TipoAtividade; prazo: string | null; pontos: number; publicada: boolean }): FormAtividade => ({
  titulo: a.titulo,
  instrucoes: a.instrucoes ?? "",
  tipo: a.tipo,
  prazo: isoParaCampo(a.prazo),
  pontos: String(a.pontos).replace(".", ","),
  publicada: a.publicada,
});

/** "7,5" ou "7.5" -> 7.5; vazio/ruim -> NaN. */
export const lerNumero = (texto: string): number => {
  const t = texto.trim().replace(",", ".");
  return t === "" ? NaN : Number(t);
};

export type Validado<T> = { ok: true; dados: T } | { ok: false; erros: Record<string, string> };

/** Espelha o servidor (que continua sendo a palavra final): título 2–160, pontos 0,01–100, prazo válido. */
export function validarAtividade(f: FormAtividade): Validado<DadosAtividade> {
  const erros: Record<string, string> = {};
  const titulo = f.titulo.trim();
  if (titulo.length < 2) erros.titulo = "Informe um título com pelo menos 2 letras.";
  else if (titulo.length > 160) erros.titulo = "O título pode ter no máximo 160 caracteres.";

  if (f.instrucoes.length > 10000) erros.instrucoes = "As instruções podem ter no máximo 10.000 caracteres.";

  const pontos = lerNumero(f.pontos);
  if (!Number.isFinite(pontos) || pontos < 0.01 || pontos > 100) erros.pontos = "Pontuação de 0,01 a 100.";

  const prazo = campoParaIso(f.prazo);
  if (prazo === undefined) erros.prazo = "Prazo inválido.";

  if (Object.keys(erros).length) return { ok: false, erros };
  return {
    ok: true,
    dados: {
      titulo,
      instrucoes: f.instrucoes.trim(),
      tipo: f.tipo,
      prazo: prazo ?? null,
      pontos: Math.round(pontos * 100) / 100,
      publicada: f.publicada,
    },
  };
}

export type FormTurma = { nome: string; disciplina: string; anoLetivo: string; descricao: string };
export const formTurmaVazio = (): FormTurma => ({ nome: "", disciplina: "", anoLetivo: "", descricao: "" });

export function validarTurma(f: FormTurma): Validado<{ nome: string; disciplina: string; anoLetivo: string; descricao: string }> {
  const erros: Record<string, string> = {};
  const nome = f.nome.trim();
  const disciplina = f.disciplina.trim();
  if (nome.length < 2) erros.nome = "Informe o nome da turma (mínimo 2 letras).";
  else if (nome.length > 120) erros.nome = "O nome pode ter no máximo 120 caracteres.";
  if (disciplina.length < 2) erros.disciplina = "Informe a disciplina (mínimo 2 letras).";
  else if (disciplina.length > 120) erros.disciplina = "A disciplina pode ter no máximo 120 caracteres.";
  if (f.anoLetivo.trim().length > 20) erros.anoLetivo = "Ano letivo: até 20 caracteres.";
  if (f.descricao.length > 1000) erros.descricao = "A descrição pode ter no máximo 1.000 caracteres.";
  if (Object.keys(erros).length) return { ok: false, erros };
  return { ok: true, dados: { nome, disciplina, anoLetivo: f.anoLetivo.trim(), descricao: f.descricao.trim() } };
}

/** Nota digitada para uma entrega: 0 até o máximo da atividade. */
export function validarNota(texto: string, maximo: number): { ok: true; nota: number } | { ok: false; erro: string } {
  const n = lerNumero(texto);
  if (!Number.isFinite(n)) return { ok: false, erro: "Informe a nota." };
  if (n < 0) return { ok: false, erro: "A nota não pode ser negativa." };
  if (n > maximo) return { ok: false, erro: `A nota não pode passar de ${String(maximo).replace(".", ",")}.` };
  return { ok: true, nota: Math.round(n * 100) / 100 };
}

export type FiltroEntrega = "todas" | "aCorrigir" | "corrigidas" | "semEntrega";

export function filtrarEntregas(lista: EntregaProfessor[], filtro: FiltroEntrega): EntregaProfessor[] {
  switch (filtro) {
    case "aCorrigir":
      return lista.filter((e) => e.entregaId !== null && e.corrigidaEm === null);
    case "corrigidas":
      return lista.filter((e) => e.corrigidaEm !== null);
    case "semEntrega":
      return lista.filter((e) => e.entregaId === null);
    default:
      return lista;
  }
}

export function contagemEntregas(lista: EntregaProfessor[]) {
  const c = { todas: lista.length, aCorrigir: 0, corrigidas: 0, semEntrega: 0 };
  for (const e of lista) {
    if (e.entregaId === null) c.semEntrega += 1;
    else if (e.corrigidaEm === null) c.aCorrigir += 1;
    else c.corrigidas += 1;
  }
  return c;
}

/** Média (0–100) da turma nesta atividade, só com o que já foi corrigido; sem correção = null. */
export function mediaDaAtividade(lista: EntregaProfessor[], pontos: number): number | null {
  const notas = lista.filter((e) => e.corrigidaEm !== null && e.nota !== null).map((e) => e.nota as number);
  if (!notas.length || !(pontos > 0)) return null;
  const media = notas.reduce((a, b) => a + b, 0) / notas.length;
  return Math.round((media / pontos) * 100);
}

/** Status mostrado ao professor para um aluno da atividade (sem prazo estourado = "pendente"). */
export const rotuloEntrega = (s: StatusEntrega): string =>
  ({ pendente: "Não entregou", atrasada: "Não entregou (atrasada)", entregue: "Aguardando correção", corrigida: "Corrigida" })[s];

export const rotuloAtividade = (a: Pick<AtividadeProfessor, "publicada">) => (a.publicada ? "Publicada" : "Rascunho");

/** Texto "x de y" quando há base; sem alunos não há como medir. */
export const fracao = (parte: number, total: number) => (total > 0 ? `${parte} de ${total}` : "Sem alunos");

export const textoTurmas = (n: number) => `${n} ${n === 1 ? "turma" : "turmas"}`;
export const textoAlunos = (n: number) => `${n} ${n === 1 ? "aluno" : "alunos"}`;
