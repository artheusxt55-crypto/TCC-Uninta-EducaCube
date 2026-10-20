import type { AtividadeAluno, StatusEntrega } from "../../lib/api-plataforma";

/* Regras puras do dashboard do aluno (sem React, sem rede) — testáveis em tests/aluno-logica.test.ts. */

export const ROTULO_STATUS: Record<StatusEntrega, string> = {
  pendente: "Pendente",
  atrasada: "Atrasada",
  entregue: "Entregue",
  corrigida: "Corrigida",
};

const DIA_MS = 86_400_000;

const inicioDoDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Dias de calendário entre `agora` e o prazo (negativo = já passou). `null` se não há prazo/prazo inválido. */
export function diasAteOPrazo(prazo: string | null, agora = new Date()): number | null {
  if (!prazo) return null;
  const d = new Date(prazo);
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((inicioDoDia(d) - inicioDoDia(agora)) / DIA_MS);
}

export function textoDoPrazo(prazo: string | null, agora = new Date()): string {
  const dias = diasAteOPrazo(prazo, agora);
  if (dias === null) return "Sem prazo";
  if (dias === 0) return "Vence hoje";
  if (dias === 1) return "Vence amanhã";
  if (dias === -1) return "Venceu ontem";
  if (dias > 1) return `Vence em ${dias} dias`;
  return `Venceu há ${-dias} dias`;
}

export function dataCurta(valor: string | null): string {
  if (!valor) return "—";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
}

export function dataHora(valor: string | null): string {
  if (!valor) return "—";
  const d = new Date(valor);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Percentual inteiro limitado a 0–100; `null` quando não há base para calcular. */
export function percentual(parte: number, total: number): number | null {
  if (!Number.isFinite(parte) || !Number.isFinite(total) || total <= 0) return null;
  return Math.min(100, Math.max(0, Math.round((parte / total) * 100)));
}

export function textoDaNota(nota: number | null, pontos: number): string {
  if (nota === null) return "Sem nota";
  const n = Number.isInteger(nota) ? String(nota) : nota.toFixed(1).replace(".", ",");
  const p = Number.isInteger(pontos) ? String(pontos) : pontos.toFixed(1).replace(".", ",");
  return `${n} / ${p}`;
}

/** Faixa de desempenho para colorir/rotular a média. `null` = sem média ainda. */
export function faixaDeDesempenho(media: number | null): "alto" | "medio" | "baixo" | null {
  if (media === null) return null;
  if (media >= 70) return "alto";
  if (media >= 50) return "medio";
  return "baixo";
}

const porPrazo = (a: AtividadeAluno, b: AtividadeAluno) => {
  const ta = a.prazo ? new Date(a.prazo).getTime() : Infinity;
  const tb = b.prazo ? new Date(b.prazo).getTime() : Infinity;
  return ta - tb;
};

/** O que ainda precisa de ação do aluno (pendentes e atrasadas), mais urgentes primeiro. */
export const aFazer = (lista: AtividadeAluno[]) =>
  lista.filter((a) => a.status === "pendente" || a.status === "atrasada").sort(porPrazo);

export const atrasadas = (lista: AtividadeAluno[]) => lista.filter((a) => a.status === "atrasada");

export function contagemPorStatus(lista: AtividadeAluno[]): Record<StatusEntrega, number> {
  const c: Record<StatusEntrega, number> = { pendente: 0, atrasada: 0, entregue: 0, corrigida: 0 };
  for (const a of lista) c[a.status] += 1;
  return c;
}

export type Filtro = "todas" | StatusEntrega;

export function filtrar(lista: AtividadeAluno[], filtro: Filtro, busca: string): AtividadeAluno[] {
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  return lista
    .filter((a) => filtro === "todas" || a.status === filtro)
    .filter(
      (a) =>
        !termo ||
        a.titulo.toLocaleLowerCase("pt-BR").includes(termo) ||
        a.disciplina.toLocaleLowerCase("pt-BR").includes(termo) ||
        a.turma.toLocaleLowerCase("pt-BR").includes(termo),
    )
    .sort(porPrazo);
}

/** Agrupa atividades com prazo por dia (AAAA-MM-DD local), em ordem cronológica. Sem prazo = fora da agenda. */
export function agruparPorDia(lista: AtividadeAluno[]): { dia: string; itens: AtividadeAluno[] }[] {
  const mapa = new Map<string, AtividadeAluno[]>();
  for (const a of [...lista].sort(porPrazo)) {
    if (!a.prazo) continue;
    const d = new Date(a.prazo);
    if (Number.isNaN(d.getTime())) continue;
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    mapa.set(chave, [...(mapa.get(chave) ?? []), a]);
  }
  return [...mapa.entries()].map(([dia, itens]) => ({ dia, itens }));
}

export function tituloDoDia(chave: string, agora = new Date()): string {
  const [a, m, d] = chave.split("-").map(Number);
  const data = new Date(a, m - 1, d);
  const dias = Math.round((data.getTime() - inicioDoDia(agora)) / DIA_MS);
  const base = data.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  if (dias === 0) return `Hoje · ${base}`;
  if (dias === 1) return `Amanhã · ${base}`;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

export function saudacao(agora = new Date()): string {
  const h = agora.getHours();
  if (h < 5) return "Boa madrugada";
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export function primeiroNome(nome: string | null | undefined, email?: string | null): string {
  const base = (nome ?? "").trim() || (email ?? "").split("@")[0] || "";
  const palavra = base.split(/\s+/)[0] ?? "";
  return palavra ? palavra.charAt(0).toLocaleUpperCase("pt-BR") + palavra.slice(1) : "Aluno";
}

/** Código de turma: só A–Z/0–9, maiúsculo, no máximo 12 (igual ao servidor). */
export const normalizarCodigo = (valor: string) => valor.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
