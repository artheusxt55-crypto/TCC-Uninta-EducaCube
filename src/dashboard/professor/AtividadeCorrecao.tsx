import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { apiProfessor, type AtividadeBasica, type EntregaProfessor } from "../../lib/api-plataforma";
import { Aviso, Cabecalho, Carregando, ConfirmarAcao, EstadoErro, EstadoVazio, Selo, useTitulo } from "../comuns";
import { dataHora, textoDaNota, textoDoPrazo } from "../aluno/logica";
import FormularioAtividade from "./FormAtividade";
import { useProfessor, usuarioAtual } from "./ProfessorDados";
import { ROTA } from "./rotas";
import {
  contagemEntregas,
  filtrarEntregas,
  formDaAtividade,
  mediaDaAtividade,
  rotuloEntrega,
  validarNota,
  type FiltroEntrega,
} from "./logica";

const msg = (e: unknown) => (e instanceof Error ? e.message : "Algo deu errado. Tente novamente.");

const FILTROS: { chave: FiltroEntrega; rotulo: string }[] = [
  { chave: "todas", rotulo: "Todos" },
  { chave: "aCorrigir", rotulo: "A corrigir" },
  { chave: "corrigidas", rotulo: "Corrigidas" },
  { chave: "semEntrega", rotulo: "Sem entrega" },
];

type Carga = { atividade: AtividadeBasica; entregas: EntregaProfessor[] };

export default function AtividadeCorrecao() {
  const { turmaId = "", id = "" } = useParams();
  const navegar = useNavigate();
  const { atualizar } = useProfessor();

  const [carga, setCarga] = useState<Carga | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroEntrega>("todas");
  const [editando, setEditando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);

  useTitulo(carga?.atividade.titulo ?? "Atividade");

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      setCarga(await apiProfessor.entregas(usuarioAtual(), id));
    } catch (e) {
      setErro(msg(e));
    }
  }, [id]);

  useEffect(() => {
    setCarga(null);
    setAviso(null);
    setEditando(false);
    setFiltro("todas");
    void carregar();
  }, [carregar]);

  const voltar = (
    <Link className="edc-voltar" to={ROTA.turma(turmaId)}>
      <ArrowLeft aria-hidden="true" size={16} /> Voltar à turma
    </Link>
  );

  if (erro) {
    return (
      <>
        {voltar}
        <EstadoErro mensagem={erro} onTentar={() => void carregar()} />
      </>
    );
  }
  if (!carga) return <Carregando linhas={4} rotulo="Carregando entregas…" />;

  const { atividade, entregas } = carga;
  const c = contagemEntregas(entregas);
  const media = mediaDaAtividade(entregas, atividade.pontos);
  const lista = filtrarEntregas(entregas, filtro);

  async function alternarPublicacao() {
    setOcupado("publicar");
    setAviso(null);
    try {
      await apiProfessor.atualizarAtividade(usuarioAtual(), atividade.id, { publicada: !atividade.publicada });
      await carregar();
      await atualizar();
      setAviso({ tipo: "sucesso", texto: atividade.publicada ? "Atividade voltou para rascunho. Os alunos deixam de vê-la." : "Atividade publicada para os alunos." });
    } catch (e) {
      setAviso({ tipo: "erro", texto: msg(e) });
    } finally {
      setOcupado(null);
    }
  }

  return (
    <>
      {voltar}

      <Cabecalho
        titulo={atividade.titulo}
        descricao={`${atividade.tipo === "avaliacao" ? "Avaliação" : "Atividade"} · ${atividade.pontos} pts · ${
          atividade.prazo ? `${dataHora(atividade.prazo)} (${textoDoPrazo(atividade.prazo)})` : "Sem prazo"
        } · ${atividade.publicada ? "Publicada" : "Rascunho"}`}
        acoes={
          <>
            <button type="button" className="edc-btn edc-btn-secundario" onClick={() => setEditando((v) => !v)} aria-expanded={editando}>
              <Pencil aria-hidden="true" size={16} /> Editar
            </button>
            <button type="button" className="edc-btn edc-btn-secundario" onClick={() => void alternarPublicacao()} disabled={ocupado === "publicar"}>
              {atividade.publicada ? <EyeOff aria-hidden="true" size={16} /> : <Eye aria-hidden="true" size={16} />}
              {atividade.publicada ? "Voltar para rascunho" : "Publicar"}
            </button>
          </>
        }
      />

      {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}

      {editando ? (
        <section className="edc-cartao" aria-labelledby="ac-editar">
          <h2 id="ac-editar">Editar atividade</h2>
          <FormularioAtividade
            inicial={formDaAtividade(atividade)}
            rotuloEnviar="Salvar alterações"
            onCancelar={() => setEditando(false)}
            onEnviar={async (d) => {
              await apiProfessor.atualizarAtividade(usuarioAtual(), atividade.id, d);
              await carregar();
              await atualizar();
              setEditando(false);
              setAviso({ tipo: "sucesso", texto: "Atividade atualizada." });
            }}
          />
        </section>
      ) : null}

      {atividade.instrucoes ? (
        <section className="edc-cartao" aria-labelledby="ac-instr">
          <h2 id="ac-instr">Instruções</h2>
          <p className="edc-texto-longo">{atividade.instrucoes}</p>
        </section>
      ) : null}

      <section className="edc-grade-metricas" aria-label="Resumo das entregas">
        <div className="edc-cartao edc-metrica">
          <span className="edc-metrica-valor">{c.todas - c.semEntrega}/{c.todas}</span>
          <span className="edc-metrica-rotulo">Entregas</span>
        </div>
        <div className="edc-cartao edc-metrica">
          <span className="edc-metrica-valor">{c.aCorrigir}</span>
          <span className="edc-metrica-rotulo">A corrigir</span>
        </div>
        <div className="edc-cartao edc-metrica">
          <span className="edc-metrica-valor">{c.corrigidas}</span>
          <span className="edc-metrica-rotulo">Corrigidas</span>
        </div>
        <div className="edc-cartao edc-metrica">
          <span className="edc-metrica-valor">{media === null ? "—" : `${media}%`}</span>
          <span className="edc-metrica-rotulo">Média da turma</span>
          {media === null ? <span className="edc-metrica-nota">Aparece após a primeira correção</span> : null}
        </div>
      </section>

      {entregas.length === 0 ? (
        <EstadoVazio titulo="Esta turma ainda não tem alunos" texto="Quando alunos entrarem com o código da turma, eles aparecem aqui." />
      ) : (
        <>
          <div className="edc-filtros" role="group" aria-label="Filtrar entregas">
            {FILTROS.map((f) => (
              <button key={f.chave} type="button" className="edc-filtro" aria-pressed={filtro === f.chave} onClick={() => setFiltro(f.chave)}>
                {f.rotulo} ({c[f.chave]})
              </button>
            ))}
          </div>

          <p className="edc-sr" role="status" aria-live="polite">
            {lista.length} {lista.length === 1 ? "aluno" : "alunos"} na lista
          </p>

          {lista.length === 0 ? (
            <EstadoVazio titulo="Ninguém nesta situação" texto="Escolha outro filtro para ver os demais alunos." />
          ) : (
            <ul className="edc-lista edc-lista-correcao">
              {lista.map((e) => (
                <li key={e.alunoUid}>
                  <CartaoEntrega
                    entrega={e}
                    pontos={atividade.pontos}
                    onCorrigir={async (nota, feedback) => {
                      if (!e.entregaId) return;
                      await apiProfessor.corrigir(usuarioAtual(), e.entregaId, nota, feedback);
                      await carregar();
                      await atualizar();
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <section className="edc-cartao edc-zona-risco" aria-labelledby="ac-risco">
        <h2 id="ac-risco">Excluir atividade</h2>
        <p className="edc-item-meta">Apaga a atividade e todas as entregas e notas dela. Não dá para desfazer. Para só esconder dos alunos, use “Voltar para rascunho”.</p>
        <div>
          <ConfirmarAcao
            rotulo="Excluir atividade"
            icone={<Trash2 aria-hidden="true" size={16} />}
            pergunta={`Excluir “${atividade.titulo}” e as ${c.todas - c.semEntrega} entregas?`}
            confirmar="Sim, excluir definitivamente"
            ocupado={ocupado === "excluir"}
            onConfirmar={async () => {
              setOcupado("excluir");
              try {
                await apiProfessor.excluirAtividade(usuarioAtual(), atividade.id);
                await atualizar();
                navegar(ROTA.turma(turmaId), { replace: true });
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

function CartaoEntrega({
  entrega,
  pontos,
  onCorrigir,
}: {
  entrega: EntregaProfessor;
  pontos: number;
  onCorrigir: (nota: number, feedback: string) => Promise<void>;
}) {
  const id = useId();
  const [nota, setNota] = useState(entrega.nota === null ? "" : String(entrega.nota).replace(".", ","));
  const [feedback, setFeedback] = useState(entrega.feedback ?? "");
  const [erroNota, setErroNota] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  const entregou = entrega.entregaId !== null;
  const corrigida = entrega.corrigidaEm !== null;

  async function enviar(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (ocupado) return;
    const v = validarNota(nota, pontos);
    if (!v.ok) {
      setErroNota(v.erro);
      return;
    }
    setErroNota(null);
    setOcupado(true);
    setAviso(null);
    try {
      await onCorrigir(v.nota, feedback.trim());
      setAviso({ tipo: "sucesso", texto: "Correção salva." });
    } catch (e) {
      setAviso({ tipo: "erro", texto: msg(e) });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <article className="edc-cartao edc-entrega" aria-labelledby={`${id}-n`}>
      <div className="edc-cartao-cabeca">
        <div>
          <h3 id={`${id}-n`} className="edc-item-titulo">
            {entrega.aluno || "Aluno sem nome"}
          </h3>
          <p className="edc-item-meta">{entregou ? `Enviada em ${dataHora(entrega.enviadaEm)}` : "Ainda não entregou"}</p>
        </div>
        <span className="edc-item-lado">
          {corrigida ? <span className="edc-prazo">{textoDaNota(entrega.nota, pontos)}</span> : null}
          <Selo status={entrega.status} rotulo={rotuloEntrega(entrega.status)} />
        </span>
      </div>

      {entregou ? (
        <>
          <div className="edc-resposta">
            <h4 className="edc-campo-rotulo">Resposta do aluno</h4>
            <p className="edc-texto-longo">{entrega.resposta}</p>
          </div>

          <form className="edc-form edc-form-correcao" onSubmit={enviar} noValidate>
            <div className="edc-linha-campos">
              <div className="edc-campo edc-campo-nota">
                <label htmlFor={`${id}-nota`}>Nota (de 0 a {String(pontos).replace(".", ",")})</label>
                <input
                  id={`${id}-nota`}
                  className="edc-entrada"
                  inputMode="decimal"
                  value={nota}
                  onChange={(e) => setNota(e.target.value)}
                  aria-invalid={erroNota ? true : undefined}
                  aria-describedby={erroNota ? `${id}-nota-e` : undefined}
                />
                {erroNota ? (
                  <small id={`${id}-nota-e`} className="edc-erro-campo">
                    {erroNota}
                  </small>
                ) : null}
              </div>
              <div className="edc-campo edc-campo-feedback">
                <label htmlFor={`${id}-fb`}>Comentário para o aluno</label>
                <textarea
                  id={`${id}-fb`}
                  className="edc-area edc-area-curta"
                  value={feedback}
                  maxLength={5000}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>
            </div>
            <div>
              <button type="submit" className="edc-btn edc-btn-primario" disabled={ocupado}>
                <Check aria-hidden="true" size={16} /> {ocupado ? "Salvando…" : corrigida ? "Atualizar correção" : "Salvar correção"}
              </button>
            </div>
            {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}
          </form>
        </>
      ) : null}
    </article>
  );
}
