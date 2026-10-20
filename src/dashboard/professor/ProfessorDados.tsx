import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { auth } from "../../lib/firebase";
import { apiProfessor, type DadosTurma, type ResumoProfessor, type TurmaProfessor } from "../../lib/api-plataforma";

type Estado =
  | { status: "carregando" }
  | { status: "erro"; mensagem: string }
  | { status: "pronto"; resumo: ResumoProfessor; turmas: TurmaProfessor[] };

type Contexto = {
  estado: Estado;
  recarregar: () => Promise<void>;
  /** Atualiza resumo/turmas sem piscar a tela (depois de alterar algo). */
  atualizar: () => Promise<void>;
  criarTurma: (dados: DadosTurma) => Promise<TurmaProfessor>;
  atualizarTurma: (id: string, dados: Partial<DadosTurma> & { arquivada?: boolean }) => Promise<void>;
  excluirTurma: (id: string) => Promise<void>;
};

const Ctx = createContext<Contexto | null>(null);

const mensagemDe = (e: unknown) => (e instanceof Error ? e.message : "Algo deu errado. Tente novamente.");

export function usuarioAtual() {
  const u = auth.currentUser;
  if (!u) throw new Error("Sessão expirada. Entre novamente.");
  return u;
}

/* Fonte única dos dados do professor. Tudo vem do servidor (Neon); nada é inventado no navegador. */
export function ProfessorDados({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<Estado>({ status: "carregando" });
  const geracao = useRef(0);

  const carregar = useCallback(async (silencioso: boolean) => {
    const minha = ++geracao.current;
    if (!silencioso) setEstado({ status: "carregando" });
    try {
      const u = usuarioAtual();
      const [resumo, turmas] = await Promise.all([apiProfessor.resumo(u), apiProfessor.turmas(u)]);
      if (minha === geracao.current) setEstado({ status: "pronto", resumo, turmas });
    } catch (e) {
      if (minha === geracao.current) setEstado({ status: "erro", mensagem: mensagemDe(e) });
    }
  }, []);

  useEffect(() => {
    void carregar(false);
    return () => {
      geracao.current += 1;
    };
  }, [carregar]);

  const valor = useMemo<Contexto>(
    () => ({
      estado,
      recarregar: () => carregar(false),
      atualizar: () => carregar(true),
      criarTurma: async (dados) => {
        const t = await apiProfessor.criarTurma(usuarioAtual(), dados);
        await carregar(true);
        return t;
      },
      atualizarTurma: async (id, dados) => {
        await apiProfessor.atualizarTurma(usuarioAtual(), id, dados);
        await carregar(true);
      },
      excluirTurma: async (id) => {
        await apiProfessor.excluirTurma(usuarioAtual(), id);
        await carregar(true);
      },
    }),
    [estado, carregar],
  );

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useProfessor() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useProfessor fora de <ProfessorDados>");
  return c;
}
