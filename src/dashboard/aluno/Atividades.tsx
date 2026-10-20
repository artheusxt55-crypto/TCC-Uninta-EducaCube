import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Cabecalho, Carregando, EstadoErro, EstadoVazio, Selo, useTitulo } from "../comuns";
import { useAluno } from "./AlunoDados";
import { ROTA } from "./rotas";
import { contagemPorStatus, filtrar, ROTULO_STATUS, textoDaNota, textoDoPrazo, type Filtro } from "./logica";

const FILTROS: Filtro[] = ["todas", "pendente", "atrasada", "entregue", "corrigida"];

export default function Atividades() {
  useTitulo("Atividades");
  const { estado, recarregar } = useAluno();
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busca, setBusca] = useState("");

  const atividades = estado.status === "pronto" ? estado.atividades : [];
  const lista = useMemo(() => filtrar(atividades, filtro, busca), [atividades, filtro, busca]);
  const contagem = useMemo(() => contagemPorStatus(atividades), [atividades]);

  if (estado.status === "carregando") return <Carregando linhas={5} rotulo="Carregando atividades…" />;
  if (estado.status === "erro") return <EstadoErro mensagem={estado.mensagem} onTentar={() => void recarregar()} />;

  return (
    <>
      <Cabecalho titulo="Atividades" descricao="Tudo o que seus professores publicaram, com prazo e situação." />

      {estado.turmas.length === 0 ? (
        <EstadoVazio
          titulo="Você ainda não está em nenhuma turma"
          texto="Entre em uma turma para ver as atividades dela."
          acao={
            <Link className="edc-btn edc-btn-primario" to={ROTA.disciplinas}>
              Entrar em uma turma
            </Link>
          }
        />
      ) : atividades.length === 0 ? (
        <EstadoVazio titulo="Nenhuma atividade publicada" texto="Quando o professor publicar uma atividade, ela aparece aqui." />
      ) : (
        <>
          <div className="edc-ferramentas">
            <div className="edc-filtros" role="group" aria-label="Filtrar por situação">
              {FILTROS.map((f) => (
                <button key={f} type="button" className="edc-filtro" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>
                  {f === "todas" ? `Todas (${atividades.length})` : `${ROTULO_STATUS[f]} (${contagem[f]})`}
                </button>
              ))}
            </div>
            <div className="edc-campo edc-busca">
              <label className="edc-sr" htmlFor="al-busca">
                Buscar atividades
              </label>
              <input
                id="al-busca"
                type="search"
                className="edc-entrada"
                placeholder="Buscar por título ou disciplina"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>
          </div>

          <p className="edc-sr" role="status" aria-live="polite">
            {lista.length} {lista.length === 1 ? "atividade encontrada" : "atividades encontradas"}
          </p>

          {lista.length === 0 ? (
            <EstadoVazio
              titulo="Nada encontrado"
              texto="Nenhuma atividade corresponde ao filtro ou à busca."
              acao={
                <button
                  type="button"
                  className="edc-btn edc-btn-secundario"
                  onClick={() => {
                    setFiltro("todas");
                    setBusca("");
                  }}
                >
                  Limpar filtros
                </button>
              }
            />
          ) : (
            <ul className="edc-lista">
              {lista.map((a) => (
                <li key={a.id}>
                  <Link className="edc-item" to={ROTA.atividade(a.id)}>
                    <span className="edc-item-texto">
                      <span className="edc-item-titulo">{a.titulo}</span>
                      <span className="edc-item-meta">
                        {a.disciplina} · {a.turma} · {a.tipo === "avaliacao" ? "Avaliação" : "Atividade"}
                      </span>
                    </span>
                    <span className="edc-item-lado">
                      {a.status === "corrigida" ? (
                        <span className="edc-prazo">{textoDaNota(a.nota, a.pontos)}</span>
                      ) : (
                        <span className={`edc-prazo${a.status === "atrasada" ? " edc-prazo-atrasada" : ""}`}>
                          {textoDoPrazo(a.prazo)}
                        </span>
                      )}
                      <Selo status={a.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
