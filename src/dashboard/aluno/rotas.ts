/* Caminhos absolutos do painel do aluno. Links relativos mudam de significado conforme a rota
   em que estão (rotas aninhadas com "*"); os absolutos não. */
const BASE = "/app/dashboard/aluno";

export const ROTA = {
  inicio: BASE,
  atividades: `${BASE}/atividades`,
  atividade: (id: string) => `${BASE}/atividades/${encodeURIComponent(id)}`,
  disciplinas: `${BASE}/disciplinas`,
  progresso: `${BASE}/progresso`,
  agenda: `${BASE}/agenda`,
  perfil: `${BASE}/perfil`,
} as const;
