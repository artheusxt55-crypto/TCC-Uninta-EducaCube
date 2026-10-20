import { Link } from "react-router-dom";
import { Barra, Cabecalho, Carregando, EstadoErro, EstadoVazio, useTitulo } from "../comuns";
import { useAluno } from "./AlunoDados";
import { ROTA } from "./rotas";
import { faixaDeDesempenho, percentual } from "./logica";

const TEXTO_FAIXA = { alto: "Bom desempenho", medio: "Atenção", baixo: "Precisa melhorar" } as const;

export default function Progresso() {
  useTitulo("Progresso");
  const { estado, recarregar } = useAluno();

  if (estado.status === "carregando") return <Carregando linhas={4} rotulo="Carregando progresso…" />;
  if (estado.status === "erro") return <EstadoErro mensagem={estado.mensagem} onTentar={() => void recarregar()} />;

  const p = estado.progresso;
  const faixa = faixaDeDesempenho(p.mediaPercentual);

  return (
    <>
      <Cabecalho titulo="Progresso" descricao="Calculado a partir das suas entregas e das notas dadas pelos professores." />

      {estado.turmas.length === 0 ? (
        <EstadoVazio
          titulo="Sem dados de progresso"
          texto="Entre em uma turma e envie atividades para acompanhar sua evolução."
          acao={
            <Link className="edc-btn edc-btn-primario" to={ROTA.disciplinas}>
              Entrar em uma turma
            </Link>
          }
        />
      ) : (
        <>
          <section className="edc-grade-metricas" aria-label="Resumo do progresso">
            <div className="edc-cartao edc-metrica">
              <span className="edc-metrica-valor">{p.mediaPercentual === null ? "—" : `${p.mediaPercentual}%`}</span>
              <span className="edc-metrica-rotulo">Média nas atividades corrigidas</span>
              <span className="edc-metrica-nota">
                {faixa ? TEXTO_FAIXA[faixa] : "Ainda sem notas: a média aparece após a primeira correção."}
              </span>
            </div>
            <div className="edc-cartao edc-metrica">
              <span className="edc-metrica-valor">
                {p.entregues}/{p.total}
              </span>
              <span className="edc-metrica-rotulo">Atividades entregues</span>
            </div>
            <div className="edc-cartao edc-metrica">
              <span className="edc-metrica-valor">{p.corrigidas}</span>
              <span className="edc-metrica-rotulo">Corrigidas</span>
            </div>
          </section>

          <section className="edc-cartao" aria-labelledby="al-pd">
            <h2 id="al-pd">Por disciplina</h2>
            <ul className="edc-lista">
              {p.disciplinas.map((d) => (
                <li key={d.turmaId} className="edc-item">
                  <span className="edc-item-texto">
                    <span className="edc-item-titulo">{d.disciplina}</span>
                    <span className="edc-item-meta">
                      {d.turma} · {d.entregues} de {d.total} entregues · {d.corrigidas} corrigidas
                    </span>
                  </span>
                  <span className="edc-item-barra edc-item-barra-dupla">
                    <span className="edc-item-meta">Entregas</span>
                    <Barra valor={percentual(d.entregues, d.total)} rotulo={`Entregas em ${d.disciplina}`} />
                    <span className="edc-item-meta">Média</span>
                    <Barra valor={d.mediaPercentual} rotulo={`Média em ${d.disciplina}`} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}
