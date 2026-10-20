import { LogOut } from "lucide-react";
import { auth } from "../../lib/firebase";
import { Cabecalho, useTitulo } from "../comuns";
import { useAluno } from "./AlunoDados";

export default function Perfil() {
  useTitulo("Perfil");
  const { estado } = useAluno();
  const u = auth.currentUser;

  return (
    <>
      <Cabecalho titulo="Perfil" descricao="Dados da sua conta no EducaCube." />

      <section className="edc-cartao" aria-label="Dados da conta">
        <dl className="edc-dl">
          <div>
            <dt>Nome</dt>
            <dd>{u?.displayName || "Não informado"}</dd>
          </div>
          <div>
            <dt>E-mail</dt>
            <dd>{u?.email ?? "—"}</dd>
          </div>
          <div>
            <dt>E-mail verificado</dt>
            <dd>{u?.emailVerified ? "Sim" : "Não"}</dd>
          </div>
          <div>
            <dt>Tipo de conta</dt>
            <dd>Aluno</dd>
          </div>
          <div>
            <dt>Turmas</dt>
            <dd>{estado.status === "pronto" ? estado.turmas.length : "—"}</dd>
          </div>
        </dl>
        <p className="edc-item-meta">
          O tipo de conta é definido no cadastro e não pode ser trocado: um e-mail de aluno não vira professor, e vice-versa.
        </p>
      </section>

      <div>
        <button type="button" className="edc-btn edc-btn-secundario" onClick={() => void auth.signOut()}>
          <LogOut aria-hidden="true" size={16} /> Sair da conta
        </button>
      </div>
    </>
  );
}
