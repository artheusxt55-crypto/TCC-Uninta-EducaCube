import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { auth } from "../../lib/firebase";
import {
  apiAluno,
  type AtividadeAluno,
  type Progresso,
  type TurmaAluno,
} from "../../lib/api-plataforma";

type Estado =
  | { status: "carregando" }
  | { status: "erro"; mensagem: string }
  | { status: "pronto"; turmas: TurmaAluno[]; atividades: AtividadeAluno[]; progresso: Progresso };

type Contexto = {
  estado: Estado;
  recarregar: () => Promise<void>;
  entrarNaTurma: (codigo: string) => Promise<{ nome: string; disciplina: string }>;
  sairDaTurma: (turmaId: string) => Promise<void>;
  enviarEntrega: (atividadeId: string, resposta: string) => Promise<void>;
};

const Ctx = createContext<Contexto | null>(null);

const mensagemDe = (e: unknown) => (e instanceof Error ? e.message : "Algo deu errado. Tente novamente.");

function usuarioAtual() {
  const u = auth.currentUser;
  if (!u) throw new Error("Sessão expirada. Entre novamente.");
  return u;
}

/* Fonte única dos dados do aluno. Vem do servidor (Neon); nada é inventado no navegador. */
export function AlunoDados({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ status: "carregando" });
  const geracao = useRef(0);

  const carregar = useCallback(async (silencioso: boolean) => {
    const minha = ++geracao.current;
    if (!silencioso) setEstado({ status: "carregando" });
    try {
      const u = usuarioAtual();
      const [turmas, atividades, progresso] = await Promise.all([
        apiAluno.turmas(u),
        apiAluno.atividades(u),
        apiAluno.progresso(u),
      ]);
      if (minha === geracao.current) setEstado({ status: "pronto", turmas, atividades, progresso });
    } catch (e) {
      if (minha === geracao.current) setEstado({ status: "erro", mensagem: mensagemDe(e) });
    }
  }, []);

  useEffect(() => {
    void carregar(false);
    return () => {
      geracao.current += 1; // descarta respostas que chegarem depois de sair da tela
    };
  }, [carregar]);

  const valor = useMemo<Contexto>(
    () => ({
      estado,
      recarregar: () => carregar(false),
      entrarNaTurma: async (codigo) => {
        const turma = await apiAluno.entrarNaTurma(usuarioAtual(), codigo);
        await carregar(true);
        return turma;
      },
      sairDaTurma: async (turmaId) => {
        await apiAluno.sairDaTurma(usuarioAtual(), turmaId);
        await carregar(true);
      },
      enviarEntrega: async (atividadeId, resposta) => {
        await apiAluno.enviarEntrega(usuarioAtual(), atividadeId, resposta);
        await carregar(true);
      },
    }),
    [estado, carregar],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useAluno() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAluno fora de <AlunoDados>");
  return c;
}
