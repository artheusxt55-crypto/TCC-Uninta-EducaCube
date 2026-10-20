import { useState } from "react";
import { Cabecalho, Carregando, EstadoErro, EstadoVazio, Aviso, useTitulo } from "../comuns";
import { useAluno } from "./AlunoDados";
import EntrarNaTurma from "./EntrarNaTurma";
import { dataCurta } from "./logica";

export default function Disciplinas() {
  useTitulo("Disciplinas");
  const { estado, recarregar, sairDaTurma } = useAluno();
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (estado.status === "carregando") return <Carregando linhas={3} rotulo="Carregando disciplinas…" />;
  if (estado.status === "erro") return <EstadoErro mensagem={estado.mensagem} onTentar={() => void recarregar()} />;

  async function sair(id: string) {
    setOcupado(true);
    setErro(null);
    try {
      await sairDaTurma(id);
      setConfirmando(null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível sair da turma.");
    } finally {
      setOcupado(false);
    }
  }

  const { turmas, progresso } = estado;

  return (
    <>
      <Cabecalho titulo="Disciplinas" descricao="As turmas em que você está matriculado." />

      {turmas.length === 0 ? (
        <EstadoVazio titulo="Nenhuma turma ainda" texto="Use o código passado pelo seu professor para entrar." />
      ) : (
        <ul className="edc-grade edc-grade-lista">
          {turmas.map((t) => {
            const p = progresso.disciplinas.find((d) => d.turmaId === t.id);
            return (
              <li key={t.id} className="edc-cartao">
                <h2>{t.disciplina}</h2>
                <p className="edc-item-meta">
                  {t.nome}
                  {t.ano_letivo ? ` · ${t.ano_letivo}` : ""}
                </p>
                <dl className="edc-dl">
                  <div>
                    <dt>Professor</dt>
                    <dd>{t.professor ?? "Não informado"}</dd>
                  </div>
                  <div>
                    <dt>Matrícula</dt>
                    <dd>{dataCurta(t.entrou_em)}</dd>
                  </div>
                  <div>
                    <dt>Entregas</dt>
                    <dd>{p ? `${p.entregues} de ${p.total}` : "—"}</dd>
                  </div>
                </dl>

                {confirmando === t.id ? (
                  <div className="edc-form" role="group" aria-label={`Confirmar saída de ${t.disciplina}`}>
                    <p>Sair desta turma? Suas entregas continuam salvas, mas você deixa de ver as atividades.</p>
                    <div className="edc-cabecalho-acoes">
                      <button type="button" className="edc-btn edc-btn-perigo" disabled={ocupado} onClick={() => void sair(t.id)}>
                        {ocupado ? "Saindo…" : "Sim, sair"}
                      </button>
                      <button type="button" className="edc-btn edc-btn-secundario" disabled={ocupado} onClick={() => setConfirmando(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      className="edc-btn edc-btn-secundario"
                      onClick={() => {
                        setErro(null);
                        setConfirmando(t.id);
                      }}
                    >
                      Sair da turma
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {erro ? <Aviso tipo="erro">{erro}</Aviso> : null}

      <EntrarNaTurma />
    </>
  );
}
