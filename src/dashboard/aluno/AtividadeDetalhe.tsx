import { useCallback, useEffect, useId, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { auth } from "../../lib/firebase";
import { apiAluno, type AtividadeDetalhe } from "../../lib/api-plataforma";
import { Aviso, Cabecalho, Carregando, EstadoErro, Selo, useTitulo } from "../comuns";
import { useAluno } from "./AlunoDados";
import { ROTA } from "./rotas";
import { dataHora, textoDaNota, textoDoPrazo } from "./logica";

const LIMITE = 20000;
const msg = (e: unknown) => (e instanceof Error ? e.message : "Algo deu errado. Tente novamente.");

export default function AtividadeDetalheTela() {
  const { id = "" } = useParams();
  const { enviarEntrega } = useAluno();
  const campo = useId();

  const [atv, setAtv] = useState<AtividadeDetalhe | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [resposta, setResposta] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  useTitulo(atv?.titulo ?? "Atividade");

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const u = auth.currentUser;
      if (!u) throw new Error("Sessão expirada. Entre novamente.");
      const d = await apiAluno.atividade(u, id);
      setAtv(d);
      setResposta(d.resposta ?? "");
    } catch (e) {
      setErro(msg(e));
    }
  }, [id]);

  useEffect(() => {
    setAtv(null);
    setAviso(null);
    void carregar();
  }, [carregar]);

  if (erro) {
    return (
      <>
        <Link className="edc-voltar" to={ROTA.atividades}>
          <ArrowLeft aria-hidden="true" size={16} /> Voltar às atividades
        </Link>
        <EstadoErro mensagem={erro} onTentar={() => void carregar()} />
      </>
    );
  }
  if (!atv) return <Carregando linhas={3} rotulo="Carregando atividade…" />;

  const encerrado = atv.prazo ? new Date(atv.prazo) < new Date() : false;
  const corrigida = atv.status === "corrigida";
  const podeEnviar = !corrigida && !encerrado;
  const vazio = resposta.trim().length === 0;
  const jaEnviou = atv.enviadaEm !== null;

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!atv || vazio || ocupado) return;
    setOcupado(true);
    setAviso(null);
    try {
      await enviarEntrega(atv.id, resposta);
      await carregar();
      setAviso({ tipo: "sucesso", texto: jaEnviou ? "Resposta atualizada." : "Resposta enviada ao professor." });
    } catch (erro2) {
      setAviso({ tipo: "erro", texto: msg(erro2) });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <>
      <Link className="edc-voltar" to={ROTA.atividades}>
        <ArrowLeft aria-hidden="true" size={16} /> Voltar às atividades
      </Link>

      <Cabecalho
        titulo={atv.titulo}
        descricao={`${atv.disciplina} · ${atv.turma} · ${atv.tipo === "avaliacao" ? "Avaliação" : "Atividade"}`}
        acoes={<Selo status={atv.status} />}
      />

      <section className="edc-cartao" aria-label="Informações">
        <dl className="edc-dl">
          <div>
            <dt>Prazo</dt>
            <dd>{atv.prazo ? `${dataHora(atv.prazo)} (${textoDoPrazo(atv.prazo)})` : "Sem prazo"}</dd>
          </div>
          <div>
            <dt>Pontuação</dt>
            <dd>{atv.pontos}</dd>
          </div>
          <div>
            <dt>Sua entrega</dt>
            <dd>{jaEnviou ? dataHora(atv.enviadaEm) : "Ainda não enviada"}</dd>
          </div>
          {corrigida ? (
            <div>
              <dt>Nota</dt>
              <dd>{textoDaNota(atv.nota, atv.pontos)}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="edc-cartao" aria-labelledby="al-instr">
        <h2 id="al-instr">Instruções</h2>
        {atv.instrucoes ? (
          <p className="edc-texto-longo">{atv.instrucoes}</p>
        ) : (
          <p className="edc-item-meta">O professor não adicionou instruções.</p>
        )}
      </section>

      {corrigida ? (
        <section className="edc-cartao" aria-labelledby="al-fb">
          <h2 id="al-fb">Correção do professor</h2>
          {atv.feedback ? <p className="edc-texto-longo">{atv.feedback}</p> : <p className="edc-item-meta">Sem comentários.</p>}
        </section>
      ) : null}

      <section className="edc-cartao" aria-labelledby="al-resp">
        <h2 id="al-resp">Sua resposta</h2>

        {podeEnviar ? (
          <form className="edc-form" onSubmit={enviar} noValidate>
            <div className="edc-campo">
              <label htmlFor={campo} className="edc-sr">
                Sua resposta
              </label>
              <textarea
                id={campo}
                className="edc-area"
                value={resposta}
                maxLength={LIMITE}
                onChange={(e) => setResposta(e.target.value)}
                placeholder="Escreva sua resposta aqui"
                aria-describedby={`${campo}-n`}
              />
              <small id={`${campo}-n`}>
                {resposta.length.toLocaleString("pt-BR")} / {LIMITE.toLocaleString("pt-BR")} caracteres
                {jaEnviou ? " · você pode reenviar até o professor corrigir" : ""}
              </small>
            </div>
            <div>
              <button type="submit" className="edc-btn edc-btn-primario" disabled={vazio || ocupado}>
                <Send aria-hidden="true" size={16} /> {ocupado ? "Enviando…" : jaEnviou ? "Atualizar resposta" : "Enviar resposta"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="edc-item-meta">
              {corrigida ? "Esta atividade já foi corrigida e não pode mais ser alterada." : "O prazo desta atividade encerrou."}
            </p>
            {atv.resposta ? <p className="edc-texto-longo">{atv.resposta}</p> : <p className="edc-item-meta">Nenhuma resposta enviada.</p>}
          </>
        )}

        {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}
      </section>
    </>
  );
}
