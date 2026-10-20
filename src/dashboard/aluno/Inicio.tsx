import { Link } from "react-router-dom";
import { auth } from "../../lib/firebase";
import { Barra, Cabecalho, Carregando, EstadoErro, EstadoVazio, Selo, useTitulo } from "../comuns";
import { useAluno } from "./AlunoDados";
import EntrarNaTurma from "./EntrarNaTurma";
import { ROTA } from "./rotas";
import { aFazer, atrasadas, dataCurta, primeiroNome, saudacao, textoDoPrazo } from "./logica";

export default function Inicio() {
  useTitulo("Início");
  const { estado, recarregar } = useAluno();
  const u = auth.currentUser;
  const nome = primeiroNome(u?.displayName, u?.email);

  if (estado.status === "carregando") return <Carregando linhas={4} rotulo="Carregando seu painel…" />;
  if (estado.status === "erro") return <EstadoErro mensagem={estado.mensagem} onTentar={() => void recarregar()} />;

  const { turmas, atividades, progresso } = estado;

  if (turmas.length === 0) {
    return (
      <>
        <Cabecalho titulo={`${saudacao()}, ${nome}`} descricao="Bem-vindo ao EducaCube. Vamos começar entrando na sua turma." />
        <EstadoVazio
          titulo="Você ainda não está em nenhuma turma"
          texto="Quando você entrar em uma turma, suas atividades, prazos e notas aparecem aqui."
        />
        <EntrarNaTurma titulo="Tenho um código de turma" />
      </>
    );
  }

  const pendentes = aFazer(atividades);
  const cheio = pendentes.slice(0, 5);
  const corrigidas = atividades
    .filter((a) => a.status === "corrigida")
    .sort((a, b) => new Date(b.corrigidaEm ?? 0).getTime() - new Date(a.corrigidaEm ?? 0).getTime())
    .slice(0, 3);
  const nAtrasadas = atrasadas(atividades).length;

  return (
    <>
      <Cabecalho
        titulo={`${saudacao()}, ${nome}`}
        descricao={
          pendentes.length === 0
            ? "Você está em dia. Nenhuma atividade pendente por enquanto."
            : `Você tem ${pendentes.length} ${pendentes.length === 1 ? "atividade" : "atividades"} para fazer${
                nAtrasadas ? `, ${nAtrasadas} em atraso` : ""
              }.`
        }
      />

      <section className="edc-grade-metricas" aria-label="Resumo">
        <div className="edc-cartao edc-metrica">
          <span className="edc-metrica-valor">{turmas.length}</span>
          <span className="edc-metrica-rotulo">{turmas.length === 1 ? "Turma" : "Turmas"}</span>
        </div>
        <div className="edc-cartao edc-metrica">
          <span className="edc-metrica-valor">{pendentes.length}</span>
          <span className="edc-metrica-rotulo">A fazer</span>
          {nAtrasadas ? <span className="edc-metrica-nota">{nAtrasadas} em atraso</span> : null}
        </div>
        <div className="edc-cartao edc-metrica">
          <span className="edc-metrica-valor">
            {progresso.entregues}/{progresso.total}
          </span>
          <span className="edc-metrica-rotulo">Entregues</span>
        </div>
        <div className="edc-cartao edc-metrica">
          <span className="edc-metrica-valor">{progresso.mediaPercentual === null ? "—" : `${progresso.mediaPercentual}%`}</span>
          <span className="edc-metrica-rotulo">Média geral</span>
          {progresso.mediaPercentual === null ? (
            <span className="edc-metrica-nota">Aparece após a primeira correção</span>
          ) : null}
        </div>
      </section>

      <div className="edc-grade-2">
        <section className="edc-cartao" aria-labelledby="al-prox">
          <div className="edc-cartao-cabeca">
            <h2 id="al-prox">Próximas entregas</h2>
            <Link className="edc-btn edc-btn-secundario" to={ROTA.atividades}>
              Ver todas
            </Link>
          </div>
          {cheio.length === 0 ? (
            <p className="edc-item-meta">Nada pendente. Bom trabalho!</p>
          ) : (
            <ul className="edc-lista">
              {cheio.map((a) => (
                <li key={a.id}>
                  <Link className="edc-item" to={ROTA.atividade(a.id)}>
                    <span className="edc-item-texto">
                      <span className="edc-item-titulo">{a.titulo}</span>
                      <span className="edc-item-meta">{a.disciplina}</span>
                    </span>
                    <span className="edc-item-lado">
                      <span className={`edc-prazo${a.status === "atrasada" ? " edc-prazo-atrasada" : ""}`}>
                        {textoDoPrazo(a.prazo)}
                      </span>
                      <Selo status={a.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="edc-cartao" aria-labelledby="al-notas">
          <div className="edc-cartao-cabeca">
            <h2 id="al-notas">Notas recentes</h2>
          </div>
          {corrigidas.length === 0 ? (
            <p className="edc-item-meta">Quando o professor corrigir uma atividade, a nota aparece aqui.</p>
          ) : (
            <ul className="edc-lista">
              {corrigidas.map((a) => (
                <li key={a.id}>
                  <Link className="edc-item" to={ROTA.atividade(a.id)}>
                    <span className="edc-item-texto">
                      <span className="edc-item-titulo">{a.titulo}</span>
                      <span className="edc-item-meta">
                        {a.disciplina} · corrigida em {dataCurta(a.corrigidaEm)}
                      </span>
                    </span>
                    <Selo status="corrigida" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="edc-cartao" aria-labelledby="al-disc">
        <div className="edc-cartao-cabeca">
          <h2 id="al-disc">Entregas por disciplina</h2>
          <Link className="edc-btn edc-btn-secundario" to={ROTA.progresso}>
            Ver progresso
          </Link>
        </div>
        <ul className="edc-lista">
          {progresso.disciplinas.map((d) => (
            <li key={d.turmaId} className="edc-item">
              <span className="edc-item-texto">
                <span className="edc-item-titulo">{d.disciplina}</span>
                <span className="edc-item-meta">
                  {d.turma} · {d.entregues} de {d.total} entregues
                </span>
              </span>
              <span className="edc-item-barra">
                <Barra valor={d.total ? Math.round((d.entregues / d.total) * 100) : null} rotulo={`Entregas em ${d.disciplina}`} />
              </span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
