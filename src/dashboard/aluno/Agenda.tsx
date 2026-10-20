import { Link } from "react-router-dom";
import { Cabecalho, Carregando, EstadoErro, EstadoVazio, Selo, useTitulo } from "../comuns";
import { useAluno } from "./AlunoDados";
import { ROTA } from "./rotas";
import { agruparPorDia, atrasadas, dataCurta, textoDoPrazo, tituloDoDia } from "./logica";

/* Agenda = prazos reais das atividades publicadas. Não existe calendário de eventos inventado. */
export default function Agenda() {
  useTitulo("Agenda");
  const { estado, recarregar } = useAluno();

  if (estado.status === "carregando") return <Carregando linhas={4} rotulo="Carregando agenda…" />;
  if (estado.status === "erro") return <EstadoErro mensagem={estado.mensagem} onTentar={() => void recarregar()} />;

  const lista = estado.atividades;
  const emAtraso = atrasadas(lista);
  const futuras = agruparPorDia(lista.filter((a) => a.status === "pendente" && a.prazo));

  return (
    <>
      <Cabecalho titulo="Agenda" descricao="Os próximos prazos das suas atividades, em ordem de data." />

      {emAtraso.length === 0 && futuras.length === 0 ? (
        <EstadoVazio titulo="Nenhum prazo à vista" texto="Atividades pendentes com prazo aparecem aqui, organizadas por dia." />
      ) : null}

      {emAtraso.length > 0 ? (
        <section className="edc-dia" aria-labelledby="al-ag-atraso">
          <h2 id="al-ag-atraso">Em atraso</h2>
          <ul className="edc-lista">
            {emAtraso.map((a) => (
              <li key={a.id}>
                <Link className="edc-item" to={ROTA.atividade(a.id)}>
                  <span className="edc-item-texto">
                    <span className="edc-item-titulo">{a.titulo}</span>
                    <span className="edc-item-meta">{a.disciplina}</span>
                  </span>
                  <span className="edc-item-lado">
                    <span className="edc-prazo edc-prazo-atrasada">
                      {textoDoPrazo(a.prazo)} · {dataCurta(a.prazo)}
                    </span>
                    <Selo status="atrasada" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {futuras.map(({ dia, itens }) => (
        <section key={dia} className="edc-dia" aria-labelledby={`al-ag-${dia}`}>
          <h2 id={`al-ag-${dia}`}>{tituloDoDia(dia)}</h2>
          <ul className="edc-lista">
            {itens.map((a) => (
              <li key={a.id}>
                <Link className="edc-item" to={ROTA.atividade(a.id)}>
                  <span className="edc-item-texto">
                    <span className="edc-item-titulo">{a.titulo}</span>
                    <span className="edc-item-meta">
                      {a.disciplina} · {a.turma}
                    </span>
                  </span>
                  <Selo status={a.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
