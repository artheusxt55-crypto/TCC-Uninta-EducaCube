import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { Aviso, Cabecalho, Carregando, EstadoErro, EstadoVazio, useTitulo } from "../comuns";
import FormularioTurma from "./FormTurma";
import { useProfessor } from "./ProfessorDados";
import { ROTA } from "./rotas";
import { formTurmaVazio, textoAlunos } from "./logica";

export default function Turmas() {
  useTitulo("Turmas");
  const { estado, recarregar, criarTurma } = useProfessor();
  const [params, setParams] = useSearchParams();
  const [criada, setCriada] = useState<string | null>(null);
  const [verArquivadas, setVerArquivadas] = useState(false);
  const criando = params.get("nova") === "1";

  const abrirForm = () => setParams({ nova: "1" }, { replace: true });
  const fecharForm = () => setParams({}, { replace: true });

  if (estado.status === "carregando") return <Carregando linhas={3} rotulo="Carregando turmas…" />;
  if (estado.status === "erro") return <EstadoErro mensagem={estado.mensagem} onTentar={() => void recarregar()} />;

  const ativas = estado.turmas.filter((t) => !t.arquivada);
  const arquivadas = estado.turmas.filter((t) => t.arquivada);
  const lista = verArquivadas ? arquivadas : ativas;

  return (
    <>
      <Cabecalho
        titulo="Turmas"
        descricao="Crie turmas, passe o código para os alunos e acompanhe cada uma."
        acoes={
          criando ? null : (
            <button type="button" className="edc-btn edc-btn-primario" onClick={abrirForm}>
              <Plus aria-hidden="true" size={16} /> Nova turma
            </button>
          )
        }
      />

      {criada ? <Aviso tipo="sucesso">{criada}</Aviso> : null}

      {criando ? (
        <section className="edc-cartao" aria-labelledby="pr-nova">
          <h2 id="pr-nova">Nova turma</h2>
          <FormularioTurma
            inicial={formTurmaVazio()}
            rotuloEnviar="Criar turma"
            onCancelar={fecharForm}
            onEnviar={async (d) => {
              const t = await criarTurma(d);
              setCriada(`Turma "${t.nome}" criada. Código para os alunos: ${t.codigo}`);
              fecharForm();
            }}
          />
        </section>
      ) : null}

      {arquivadas.length > 0 ? (
        <div className="edc-filtros" role="group" aria-label="Mostrar turmas">
          <button type="button" className="edc-filtro" aria-pressed={!verArquivadas} onClick={() => setVerArquivadas(false)}>
            Ativas ({ativas.length})
          </button>
          <button type="button" className="edc-filtro" aria-pressed={verArquivadas} onClick={() => setVerArquivadas(true)}>
            Arquivadas ({arquivadas.length})
          </button>
        </div>
      ) : null}

      {lista.length === 0 ? (
        criando ? null : (
          <EstadoVazio
            titulo={verArquivadas ? "Nenhuma turma arquivada" : "Nenhuma turma ainda"}
            texto={verArquivadas ? undefined : "Crie a primeira turma para começar a receber alunos."}
            acao={
              verArquivadas ? undefined : (
                <button type="button" className="edc-btn edc-btn-primario" onClick={abrirForm}>
                  <Plus aria-hidden="true" size={16} /> Criar turma
                </button>
              )
            }
          />
        )
      ) : (
        <ul className="edc-lista">
          {lista.map((t) => (
            <li key={t.id}>
              <Link className="edc-item" to={ROTA.turma(t.id)}>
                <span className="edc-item-texto">
                  <span className="edc-item-titulo">{t.nome}</span>
                  <span className="edc-item-meta">
                    {t.disciplina}
                    {t.ano_letivo ? ` · ${t.ano_letivo}` : ""} · {textoAlunos(t.total_alunos)} · {t.total_atividades}{" "}
                    {t.total_atividades === 1 ? "atividade" : "atividades"}
                  </span>
                </span>
                <span className="edc-item-lado">
                  {t.arquivada ? <span className="edc-selo edc-selo-pendente">Arquivada</span> : null}
                  <span className="edc-codigo-mini" title="Código de entrada">
                    {t.codigo}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
