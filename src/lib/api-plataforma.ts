import type { User } from "firebase/auth";
import { chamarVerificado } from "./plataforma";

/* Cliente tipado da plataforma (Camada 1: Vercel + Neon).
   Tudo passa por /api/plataforma?rota=<caminho>; a identidade vem do token, nunca do corpo. */

export type TipoAtividade = "atividade" | "avaliacao";
export type StatusEntrega = "pendente" | "atrasada" | "entregue" | "corrigida";

export type TurmaAluno = {
  id: string;
  nome: string;
  disciplina: string;
  ano_letivo: number | null;
  entrou_em: string;
  professor: string | null;
};

export type AtividadeAluno = {
  id: string;
  titulo: string;
  tipo: TipoAtividade;
  prazo: string | null;
  pontos: number;
  turmaId: string;
  turma: string;
  disciplina: string;
  enviadaEm: string | null;
  nota: number | null;
  corrigidaEm: string | null;
  status: StatusEntrega;
};

export type AtividadeDetalhe = AtividadeAluno & {
  instrucoes: string | null;
  resposta: string | null;
  feedback: string | null;
};

export type ProgressoDisciplina = {
  turmaId: string;
  turma: string;
  disciplina: string;
  total: number;
  entregues: number;
  corrigidas: number;
  mediaPercentual: number | null;
};

export type Progresso = {
  total: number;
  entregues: number;
  corrigidas: number;
  mediaPercentual: number | null;
  disciplinas: ProgressoDisciplina[];
};

const rota = (caminho: string) => `/api/plataforma?rota=${encodeURIComponent(caminho)}`;

const pedir = (user: User, metodo: string, caminho: string, corpo?: unknown) =>
  chamarVerificado(user, rota(caminho), {
    method: metodo,
    ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
  });

export const apiAluno = {
  turmas: async (user: User): Promise<TurmaAluno[]> => (await pedir(user, "GET", "turmas")).turmas ?? [],

  atividades: async (user: User): Promise<AtividadeAluno[]> =>
    (await pedir(user, "GET", "atividades")).atividades ?? [],

  atividade: async (user: User, id: string): Promise<AtividadeDetalhe> =>
    (await pedir(user, "GET", `atividades/${id}`)).atividade,

  progresso: async (user: User): Promise<Progresso> => (await pedir(user, "GET", "progresso")).progresso,

  entrarNaTurma: async (user: User, codigo: string): Promise<{ id: string; nome: string; disciplina: string }> =>
    (await pedir(user, "POST", "matriculas", { codigo })).turma,

  sairDaTurma: async (user: User, turmaId: string): Promise<void> => {
    await pedir(user, "DELETE", `matriculas/${turmaId}`);
  },

  enviarEntrega: async (user: User, atividadeId: string, resposta: string): Promise<void> => {
    await pedir(user, "PUT", `atividades/${atividadeId}/entrega`, { resposta });
  },
};

/* ===================== PROFESSOR ===================== */

export type TurmaProfessor = {
  id: string;
  nome: string;
  disciplina: string;
  ano_letivo: string | null;
  descricao: string | null;
  codigo: string;
  arquivada: boolean;
  criado_em: string;
  total_alunos: number;
  total_atividades: number;
};

export type ResumoProfessor = { turmas: number; alunos: number; atividades: number; a_corrigir: number };

export type AlunoDaTurma = { uid: string; nome: string | null; email: string | null; entrouEm: string };

export type AtividadeProfessor = {
  id: string;
  titulo: string;
  instrucoes: string;
  tipo: TipoAtividade;
  prazo: string | null;
  pontos: number;
  publicada: boolean;
  criado_em: string;
  entregas: number;
  corrigidas: number;
  total_alunos: number;
};

export type EntregaProfessor = {
  alunoUid: string;
  aluno: string | null;
  entregaId: string | null;
  resposta: string | null;
  enviadaEm: string | null;
  nota: number | null;
  feedback: string | null;
  corrigidaEm: string | null;
  status: StatusEntrega;
};

export type AtividadeBasica = {
  id: string;
  turma_id: string;
  titulo: string;
  instrucoes: string;
  tipo: TipoAtividade;
  prazo: string | null;
  pontos: number;
  publicada: boolean;
};

export type DadosTurma = { nome: string; disciplina: string; anoLetivo?: string; descricao?: string };
export type DadosAtividade = {
  titulo: string;
  instrucoes: string;
  tipo: TipoAtividade;
  prazo: string | null;
  pontos: number;
  publicada: boolean;
};

/* O Postgres devolve `numeric` como texto: converte na borda para o resto do app só ver número. */
const atividadeProf = <T extends { pontos: unknown }>(a: T) => ({ ...a, pontos: Number(a.pontos) });

export const apiProfessor = {
  resumo: async (user: User): Promise<ResumoProfessor> => (await pedir(user, "GET", "professor/resumo")).resumo,

  turmas: async (user: User): Promise<TurmaProfessor[]> => ((await pedir(user, "GET", "turmas")).turmas ?? []),

  turma: async (user: User, id: string): Promise<TurmaProfessor> => (await pedir(user, "GET", `turmas/${id}`)).turma,

  criarTurma: async (user: User, dados: DadosTurma): Promise<TurmaProfessor> =>
    (await pedir(user, "POST", "turmas", dados)).turma,

  atualizarTurma: async (user: User, id: string, dados: Partial<DadosTurma> & { arquivada?: boolean }) =>
    (await pedir(user, "PATCH", `turmas/${id}`, dados)).turma as TurmaProfessor,

  excluirTurma: async (user: User, id: string): Promise<void> => {
    await pedir(user, "DELETE", `turmas/${id}`);
  },

  alunos: async (user: User, id: string): Promise<AlunoDaTurma[]> =>
    (await pedir(user, "GET", `turmas/${id}/alunos`)).alunos ?? [],

  removerAluno: async (user: User, turmaId: string, alunoUid: string): Promise<void> => {
    await pedir(user, "DELETE", `turmas/${turmaId}/alunos/${encodeURIComponent(alunoUid)}`);
  },

  atividades: async (user: User, turmaId: string): Promise<AtividadeProfessor[]> =>
    ((await pedir(user, "GET", `turmas/${turmaId}/atividades`)).atividades ?? []).map(atividadeProf),

  criarAtividade: async (user: User, turmaId: string, dados: DadosAtividade) =>
    atividadeProf((await pedir(user, "POST", `turmas/${turmaId}/atividades`, dados)).atividade as AtividadeBasica),

  atualizarAtividade: async (user: User, id: string, dados: Partial<DadosAtividade>) =>
    atividadeProf((await pedir(user, "PATCH", `atividades/${id}`, dados)).atividade as AtividadeBasica),

  excluirAtividade: async (user: User, id: string): Promise<void> => {
    await pedir(user, "DELETE", `atividades/${id}`);
  },

  entregas: async (user: User, atividadeId: string): Promise<{ atividade: AtividadeBasica; entregas: EntregaProfessor[] }> => {
    const r = await pedir(user, "GET", `atividades/${atividadeId}/entregas`);
    return { atividade: atividadeProf(r.atividade as AtividadeBasica), entregas: r.entregas ?? [] };
  },

  corrigir: async (user: User, entregaId: string, nota: number, feedback: string): Promise<void> => {
    await pedir(user, "PUT", `entregas/${entregaId}/correcao`, { nota, feedback });
  },
};
