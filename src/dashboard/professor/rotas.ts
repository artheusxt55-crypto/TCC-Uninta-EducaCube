/* Caminhos absolutos do painel do professor (links relativos mudam de sentido em rotas aninhadas). */
const BASE = "/app/dashboard/professor";

export const ROTA = {
  inicio: BASE,
  turmas: `${BASE}/turmas`,
  turma: (id: string) => `${BASE}/turmas/${encodeURIComponent(id)}`,
  atividade: (turmaId: string, id: string) => `${BASE}/turmas/${encodeURIComponent(turmaId)}/atividades/${encodeURIComponent(id)}`,
  perfil: `${BASE}/perfil`,
} as const;
