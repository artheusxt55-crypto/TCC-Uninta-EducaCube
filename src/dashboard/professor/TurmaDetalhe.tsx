import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Archive, ArchiveRestore, ArrowLeft, Copy, Pencil, Plus, Trash2, UserMinus } from "lucide-react";
import {
  apiProfessor,
  type AlunoDaTurma,
  type AtividadeProfessor,
  type TurmaProfessor,
} from "../../lib/api-plataforma";
import { Aviso, Cabecalho, Carregando, ConfirmarAcao, EstadoErro, EstadoVazio, useTitulo } from "../comuns";
import { dataHora, textoDoPrazo } from "../aluno/logica";
import FormularioAtividade from "./FormAtividade";
import FormularioTurma from "./FormTurma";
import { useProfessor, usuarioAtual } from "./ProfessorDados";
import { ROTA } from "./rotas";
import { formVazio, fracao, rotuloAtividade, textoAlunos } from "./logica";

const msg = (e: unknown) => (e instanceof Error ? e.message : "Algo deu errado. Tente novamente.");

type Dados = { turma: TurmaProfessor; alunos: AlunoDaTurma[]; atividades: AtividadeProfessor[] };

export default function TurmaDetalhe() {
  const { id = "" } = useParams();
  const navegar = useNavigate();
  const { atualizar, atualizarTurma, excluirTurma } = useProfessor();

  const [dados, setDados] = useState<Dados | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState(false);
  const [novaAtividade, setNovaAtividade] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  useTitulo(dados?.turma.nome ?? "Turma");

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const u = usuarioAtual();
      const [turma, alunos, atividades] = await Promise.all([
        apiProfessor.turma(u, id),
        apiProfessor.alunos(u, id),
        apiProfessor.atividades(u, id),
      ]);
      setDados({ turma, alunos, atividades });
    } catch (e) {
      setErro(msg(e));
    }
  }, [id]);

  useEffect(() => {
    setDados(null);
    setAviso(null);
    setEditando(false);
    setNovaAtividade(false);
    void carregar();
  }, [carregar]);

  if (erro) {
    return (
      <>
        <Link className="edc-voltar" to={ROTA.turmas}>
          <ArrowLeft aria-hidden="true" size={16} /> Voltar às turmas
        </Link>
        <EstadoErro mensagem={erro} onTentar={() => void carregar()} />
      </>
    );
  }
  if (!dados) return <Carregando linhas={4} rotulo="Carregando turma…" />;

  const { turma, alunos, atividades } = dados;

  async function copiarCodigo() {
    try {
      await navigator.clipboard.writeText(turma.codigo);
      setAviso({ tipo: "sucesso", texto: "Código copiado." });
    } catch {
      setAviso({ tipo: "erro", texto: `Não foi possível copiar automaticamente. O código é ${turma.codigo}.` });
    }
  }

  async function executar(chave: string, acao: () => Promise<void>, sucesso: string) {
    setOcupado(chave);
    setAviso(null);
    try {
      await acao();
      await carregar();
      await atualizar();
      setAviso({ tipo: "sucesso", texto: sucesso });
    } catch (e) {
      setAviso({ tipo: "erro", texto: msg(e) });
    } finally {
      setOcupado(null);
    }
  }

  return (
    <>
      <Link className="edc-voltar" to={ROTA.turmas}>
        <ArrowLeft aria-hidden="true" size={16} /> Voltar às turmas
      </Link>

      <Cabecalho
        titulo={turma.nome}
        descricao={`${turma.disciplina}${turma.ano_letivo ? ` · ${turma.ano_letivo}` : ""}${turma.arquivada ? " · Arquivada" : ""}`}
        acoes={
          <>
            <button type="button" className="edc-btn edc-btn-secundario" onClick={() => setEditando((v) => !v)} aria-expanded={editando}>
              <Pencil aria-hidden="true" size={16} /> Editar
            </button>
            <button
              type="button"
              className="edc-btn edc-btn-secundario"
              disabled={ocupado === "arquivar"}
              onClick={() =>
                void executar(
                  "arquivar",
                  () => atualizarTurma(turma.id, { arquivada: !turma.arquivada }),
                  turma.arquivada ? "Turma reativada." : "Turma arquivada. Os alunos deixam de vê-la.",
                )
              }
            >
              {turma.arquivada ? <ArchiveRestore aria-hidden="true" size={16} /> : <Archive aria-hidden="true" size={16} />}
              {turma.arquivada ? "Reativar" : "Arquivar"}
            </button>
          </>
        }
      />

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      {editando ? (
        <section className="edc-cartao" aria-labelledby="td-editar">
          <h2 id="td-editar">Editar turma</h2>
          <FormularioTurma
            inicial={{
              nome: turma.nome,
              disciplina: turma.disciplina,
              anoLetivo: turma.ano_letivo ?? "",
              descricao: turma.descricao ?? "",
            }}
            rotuloEnviar="Salvar alterações"
            onCancelar={() => setEditando(false)}
            onEnviar={async (d) => {
              await atualizarTurma(turma.id, d);
              await carregar();
              setEditando(false);
              setAviso({ tipo: "sucesso", texto: "Turma atualizada." });
            }}
          />
        </section>
      ) : null}

      <section className="edc-cartao edc-codigo-cartao" aria-labelledby="td-codigo">
        <div>
          <h2 id="td-codigo">Código da turma</h2>
          <p className="edc-item-meta">Passe este código aos alunos. Eles entram em “Entrar em uma turma”, no painel deles.</p>
        </div>
        <div className="edc-codigo-linha">
          <code className="edc-codigo" aria-label={`Código ${turma.codigo.split("").join(" ")}`}>
            {turma.codigo}
          </code>
          <button type="button" className="edc-btn edc-btn-secundario" onClick={() => void copiarCodigo()}>
            <Copy aria-hidden="true" size={16} /> Copiar
          </button>
        </div>
      </section>

      {turma.descricao ? (
        <section className="edc-cartao" aria-label="Descrição">
          <p className="edc-texto-longo">{turma.descricao}</p>
        </section>
      ) : null}

      <section className="edc-cartao" aria-labelledby="td-atv">
        <div className="edc-cartao-cabeca">
          <h2 id="td-atv">Atividades e avaliações</h2>
          {novaAtividade ? null : (
            <button type="button" className="edc-btn edc-btn-primario" onClick={() => setNovaAtividade(true)}>
              <Plus aria-hidden="true" size={16} /> Nova atividade
            </button>
          )}
        </div>

        {novaAtividade ? (
          <FormularioAtividade
            inicial={formVazio()}
            rotuloEnviar="Criar atividade"
            onCancelar={() => setNovaAtividade(false)}
            onEnviar={async (d) => {
              await apiProfessor.criarAtividade(usuarioAtual(), turma.id, d);
              await carregar();
              await atualizar();
              setNovaAtividade(false);
              setAviso({ tipo: "sucesso", texto: d.publicada ? "Atividade publicada para os alunos." : "Atividade salva como rascunho." });
            }}
          />
        ) : null}

        {atividades.length === 0 ? (
          novaAtividade ? null : <p className="edc-item-meta">Nenhuma atividade criada ainda.</p>
        ) : (
          <ul className="edc-lista">
            {atividades.map((a) => (
              <li key={a.id}>
                <Link className="edc-item" to={ROTA.atividade(turma.id, a.id)}>
                  <span className="edc-item-texto">
                    <span className="edc-item-titulo">{a.titulo}</span>
                    <span className="edc-item-meta">
                      {a.tipo === "avaliacao" ? "Avaliação" : "Atividade"} · {a.pontos} pts ·{" "}
                      {a.prazo ? `${dataHora(a.prazo)} (${textoDoPrazo(a.prazo)})` : "Sem prazo"}
                    </span>
                  </span>
                  <span className="edc-item-lado">
                    <span className="edc-prazo">
                      {fracao(a.entregas, a.total_alunos)} entregues
                    </span>
                    {a.publicada ? null : <span className="edc-selo edc-selo-pendente">{rotuloAtividade(a)}</span>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="edc-cartao" aria-labelledby="td-alunos">
        <div className="edc-cartao-cabeca">
          <h2 id="td-alunos">Alunos ({alunos.length})</h2>
        </div>
        {alunos.length === 0 ? (
          <EstadoVazio titulo="Nenhum aluno ainda" texto={`Peça aos alunos que entrem com o código ${turma.codigo}.`} />
        ) : (
          <div className="edc-tabela-rolagem">
            <table className="edc-tabela">
              <caption className="edc-sr">{textoAlunos(alunos.length)} nesta turma</caption>
              <thead>
                <tr>
                  <th scope="col">Aluno</th>
                  <th scope="col">E-mail</th>
                  <th scope="col">Entrou em</th>
                  <th scope="col">
                    <span className="edc-sr">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {alunos.map((a) => (
                  <tr key={a.uid}>
                    <td>{a.nome || "Sem nome"}</td>
                    <td>{a.email || "—"}</td>
                    <td>{dataHora(a.entrouEm)}</td>
                    <td>
                      <ConfirmarAcao
                        rotulo="Remover"
                        icone={<UserMinus aria-hidden="true" size={16} />}
                        pergunta={`Remover ${a.nome || "este aluno"} da turma?`}
                        confirmar="Sim, remover"
                        ocupado={ocupado === `aluno-${a.uid}`}
                        onConfirmar={() =>
                          executar(`aluno-${a.uid}`, () => apiProfessor.removerAluno(usuarioAtual(), turma.id, a.uid), "Aluno removido da turma.")
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="edc-cartao edc-zona-risco" aria-labelledby="td-risco">
        <h2 id="td-risco">Excluir turma</h2>
        <p className="edc-item-meta">
          Apaga a turma, as atividades, as matrículas e todas as entregas e notas. Não dá para desfazer. Para só esconder a turma, use “Arquivar”.
        </p>
        <div>
          <ConfirmarAcao
            rotulo="Excluir turma"
            icone={<Trash2 aria-hidden="true" size={16} />}
            pergunta={`Excluir “${turma.nome}” e tudo dentro dela?`}
            confirmar="Sim, excluir definitivamente"
            ocupado={ocupado === "excluir"}
            onConfirmar={async () => {
              setOcupado("excluir");
              try {
                await excluirTurma(turma.id);
                navegar(ROTA.turmas, { replace: true });
              } catch (e) {
                setAviso({ tipo: "erro", texto: msg(e) });
                setOcupado(null);
              }
            }}
          />
        </div>
      </section>
    </>
  );
}
