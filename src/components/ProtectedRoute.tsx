import { useCallback, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged, type User } from "firebase/auth";

import { auth } from "../lib/firebase";
import { ErroPlataforma, buscarPapel, rotaDoPapel, type Papel } from "../lib/plataforma";

interface ProtectedRouteProps {
    children: React.ReactNode;
    /** Se informado, só esse papel entra (validado no servidor, consultando o Neon). */
    papel?: Papel;
}

type Estado =
    | { status: "carregando" }
    | { status: "anonimo" }
    | { status: "naoVerificado" }
    | { status: "pronto"; papel: Papel | null }
    | { status: "erro"; mensagem: string };

const telaCheia: React.CSSProperties = {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    background: "#0b0712",
    color: "#ffffff",
    padding: 24,
    textAlign: "center",
};

export default function ProtectedRoute({ children, papel }: ProtectedRouteProps) {
    const [estado, setEstado] = useState<Estado>({ status: "carregando" });
    const [tentativa, setTentativa] = useState(0);
    const location = useLocation();

    const resolver = useCallback(
        async (user: User | null) => {
            if (!user) {
                setEstado({ status: "anonimo" });
                return;
            }

            // E-mail precisa estar verificado (o servidor também exige).
            if (!user.emailVerified) {
                await user.reload().catch(() => undefined);
            }

            if (!user.emailVerified) {
                setEstado({ status: "naoVerificado" });
                return;
            }

            // Rotas sem papel (ex.: AURA) dependem só da camada Firebase.
            if (!papel) {
                setEstado({ status: "pronto", papel: null });
                return;
            }

            try {
                const real = await buscarPapel(user);
                setEstado({ status: "pronto", papel: real });
            } catch (erro) {
                if (erro instanceof ErroPlataforma && erro.codigo === "EMAIL_NOT_VERIFIED") {
                    setEstado({ status: "naoVerificado" });
                    return;
                }

                setEstado({
                    status: "erro",
                    mensagem:
                        erro instanceof ErroPlataforma
                            ? erro.message
                            : "Não foi possível validar seu acesso.",
                });
            }
        },
        [papel],
    );

    useEffect(() => {
        setEstado({ status: "carregando" });
        return onAuthStateChanged(auth, (u) => void resolver(u));
    }, [resolver, tentativa]);

    if (estado.status === "carregando") {
        return (
            <div style={telaCheia} role="status">
                Carregando...
            </div>
        );
    }

    if (estado.status === "anonimo" || estado.status === "naoVerificado") {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    }

    // Falha fechada: sem confirmação do servidor, a área protegida NÃO abre.
    if (estado.status === "erro") {
        return (
            <div style={telaCheia} role="alert">
                <b>Não foi possível validar seu acesso</b>
                <span>{estado.mensagem}</span>
                <button type="button" onClick={() => setTentativa((n) => n + 1)}>
                    Tentar novamente
                </button>
                <button type="button" onClick={() => void auth.signOut()}>
                    Sair
                </button>
            </div>
        );
    }

    if (papel) {
        // Conta sem papel definido: precisa passar pelo login.
        if (!estado.papel) {
            return <Navigate to="/login" replace state={{ from: location.pathname }} />;
        }

        // Papel diferente do exigido: vai para a área da própria conta.
        if (estado.papel !== papel) {
            return <Navigate to={rotaDoPapel(estado.papel)} replace />;
        }
    }

    return <>{children}</>;
}
