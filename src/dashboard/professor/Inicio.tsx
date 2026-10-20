import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { auth } from "../../lib/firebase";
import { Cabecalho, Carregando, EstadoErro, EstadoVazio, useTitulo } from "../comuns";
import { primeiroNome, saudacao } from "../aluno/logica";
import { useProfessor } from "./ProfessorDados";
import { ROTA } from "./rotas";
import { textoAlunos } from "./logica";

export default function Inicio() {
  useTitulo("Início");
  const { estado, recarregar } = useProfessor();
  const u = auth.currentUser;
  const nome = primeiroNome(u?.displayName, u?.email);

  if (estado.status === "carregando") return <Carregando linhas={4} rotulo="Carregando seu painel…" />;
  if (estado.status === "erro") return <EstadoErro mensagem={estado.mensagem} onTentar={() => void recarregar()} />;

  const { resumo, turmas } = estado;
  const ativas = turmas.filter((t) => !t.arquivada);

  if (turmas.length === 0) {
    return (
      <>
        <Cabecalho titulo={`${saudacao()}, ${nome}`} descricao="Vamos começar pela sua primeira turma." />
        <EstadoVazio
          titulo="Você ainda não tem turmas"
          texto="Crie uma turma e passe o código para os alunos entrarem. Depois é só publicar atividades e corrigir as entregas."
          acao={
            <Link className="edc-btn edc-btn-primario" to={`${ROTA.turmas}?nova=1`}>
              <Plus aria-hidden="true" size={16} /> Criar primeira turma
            </Link>
          }
        />
      </>
    );
  }

  return (
    <>
      <Cabecalho
        titulo={`${saudacao()}, ${nome}`}
        descricao={
          resumo.a_corrigir === 0
            ? "Nenhuma entrega aguardando correção."
            : `${resumo.a_corrigir} ${resumo.a_corrigir === 1 ? "entrega aguarda" : "entregas aguardam"} correção.`
        }
        acoes={
          <Link className="edc-btn edc-btn-primario" to={`${ROTA.turmas}?nova=1`}>
            <Plus aria-hidden="true" size={16} /> Nova turma
          </Link>
        }
      />

      <section className="edc-grade-metricas" aria-label="Resumo">
        <div className="edc-cartao edc-metrica">
          <span className="edc-metrica-valor">{resumo.turmas}</span>
          <span className="edc-metrica-rotulo">{resumo.turmas === 1 ? "Turma ativa" : "Turmas ativas"}</span>
        </div>
        <div className="edc-cartao edc-metrica">
          <span className="edc-metrica-valor">{resumo.alunos}</span>
          <span className="edc-metrica-rotulo">{resumo.alunos === 1 ? "Aluno" : "Alunos"}</span>
        </div>
        <div className="edc-cartao edc-metrica">
          <span className="edc-metrica-valor">{resumo.atividades}</span>
          <span className="edc-metrica-rotulo">{resumo.atividades === 1 ? "Atividade" : "Atividades"}</span>
        </div>
        <div className="edc-cartao edc-metrica">
          <span className="edc-metrica-valor">{resumo.a_corrigir}</span>
          <span className="edc-metrica-rotulo">A corrigir</span>
          {resumo.a_corrigir > 0 ? <span className="edc-metrica-nota">Abra uma atividade para corrigir</span> : null}
        </div>
      </section>

      <section className="edc-cartao" aria-labelledby="pr-turmas">
        <div className="edc-cartao-cabeca">
          <h2 id="pr-turmas">Suas turmas</h2>
          <Link className="edc-btn edc-btn-secundario" to={ROTA.turmas}>
            Ver todas
          </Link>
        </div>
        {ativas.length === 0 ? (
          <p className="edc-item-meta">Todas as suas turmas estão arquivadas.</p>
        ) : (
          <ul className="edc-lista">
            {ativas.slice(0, 6).map((t) => (
              <li key={t.id}>
                <Link className="edc-item" to={ROTA.turma(t.id)}>
                  <span className="edc-item-texto">
                    <span className="edc-item-titulo">{t.nome}</span>
                    <span className="edc-item-meta">
                      {t.disciplina} · {textoAlunos(t.total_alunos)} · {t.total_atividades}{" "}
                      {t.total_atividades === 1 ? "atividade" : "atividades"}
                    </span>
                  </span>
                  <span className="edc-item-lado">
                    <span className="edc-codigo-mini" title="Código de entrada">
                      {t.codigo}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
