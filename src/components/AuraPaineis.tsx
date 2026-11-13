import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  Bookmark,
  Check,
  Download,
  FilePenLine,
  Loader2,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { renderAuraMarkdown } from "./aura-markdown";

import {
  atualizarItemAura,
  criarItemAura,
  excluirItemAura,
  lerConfigAura,
  listarItensAura,
  perguntarAura,
  salvarConfigAura,
  type AuraConfig,
  type AuraItem,
  type AuraTipoItem,
} from "../lib/aura-engine";

import {
  baixarMarkdown,
  baixarPdf,
  separarGabarito,
} from "../lib/aura-export";

import {
  montarRespostas,
  type PerguntaAura,
} from "../lib/aura-perguntas";

import "../styles/aura-paineis.css";

/* Painéis da AURA ligados ao backend (Neon, cifrado):
   Meus Estudos, Provas e Exercícios, Materiais, Biblioteca (visão geral) e Configurações. */

const ROTULO_TIPO: Record<AuraTipoItem, string> = {
  estudo: "Estudo",
  prova: "Prova",
  material: "Material",
};

const TIPOS: AuraTipoItem[] = ["estudo", "prova", "material"];

function mensagemDeErro(erro: unknown): string {
  return erro instanceof Error && erro.message
    ? erro.message
    : "Algo deu errado. Tente novamente.";
}

function formatarData(iso: string): string {
  const data = new Date(iso);

  if (Number.isNaN(data.getTime())) return "";

  return data.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* ---------- salvar uma resposta do chat na biblioteca ---------- */

interface ModalSalvarProps {
  tituloSugerido: string;
  conteudo: string;
  tipoInicial?: AuraTipoItem;
  onFechar: () => void;
}

export function ModalSalvarAura({
  tituloSugerido,
  conteudo,
  tipoInicial = "estudo",
  onFechar,
}: ModalSalvarProps) {
  const [titulo, setTitulo] = useState(tituloSugerido.slice(0, 120));
  const [tipo, setTipo] = useState<AuraTipoItem>(tipoInicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [salvo, setSalvo] = useState(false);

  async function salvar(evento: FormEvent) {
    evento.preventDefault();

    if (salvando || salvo) return;

    setSalvando(true);
    setErro("");

    try {
      await criarItemAura({ tipo, titulo, conteudo });
      setSalvo(true);
      window.setTimeout(onFechar, 900);
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      className="ap-modal-fundo"
      role="dialog"
      aria-modal="true"
      aria-label="Salvar na biblioteca"
      onClick={onFechar}
    >
      <form
        className="ap-modal"
        onClick={(e) => e.stopPropagation()}
        onSubmit={salvar}
      >
        <div className="ap-modal-topo">
          <h3>Salvar na biblioteca</h3>

          <button
            type="button"
            className="ap-icone"
            aria-label="Fechar"
            onClick={onFechar}
          >
            <X size={15} />
          </button>
        </div>

        <label className="ap-campo">
          <span>Título</span>
          <input
            value={titulo}
            maxLength={120}
            onChange={(e) => setTitulo(e.target.value)}
            autoFocus
          />
        </label>

        <div className="ap-campo">
          <span>Guardar em</span>

          <div className="ap-opcoes">
            {TIPOS.map((t) => (
              <button
                key={t}
                type="button"
                className={`ap-opcao ${tipo === t ? "ativa" : ""}`}
                onClick={() => setTipo(t)}
              >
                {t === "estudo"
                  ? "Meus Estudos"
                  : t === "prova"
                  ? "Provas"
                  : "Materiais"}
              </button>
            ))}
          </div>
        </div>

        {erro && <p className="ap-erro">{erro}</p>}

        <div className="ap-modal-acoes">
          <button type="button" className="ap-botao" onClick={onFechar}>
            Cancelar
          </button>

          <button
            type="submit"
            className="ap-botao primario"
            disabled={salvando || salvo || !titulo.trim()}
          >
            {salvo ? (
              <>
                <Check size={14} /> Salvo
              </>
            ) : salvando ? (
              <>
                <Loader2 size={14} className="ap-gira" /> Salvando
              </>
            ) : (
              <>
                <Bookmark size={14} /> Salvar
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- lista de itens (estudos, provas, materiais, biblioteca) ---------- */

interface PainelItensProps {
  /** Um tipo específico, ou "todos" para a visão geral da Biblioteca. */
  tipo: AuraTipoItem | "todos";
  titulo: string;
  descricao: string;
  vazio: string;
  /** Só a tela de Provas usa o gerador. */
  comGerador?: boolean;
}

export function PainelItensAura({
  tipo,
  titulo,
  descricao,
  vazio,
  comGerador = false,
}: PainelItensProps) {
  const [itens, setItens] = useState<AuraItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [aberto, setAberto] = useState<AuraItem | null>(null);
  const [editando, setEditando] = useState(false);
  const [rascunhoTitulo, setRascunhoTitulo] = useState("");
  const [rascunhoConteudo, setRascunhoConteudo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [criando, setCriando] = useState(false);
  const [confirmarExcluir, setConfirmarExcluir] = useState(false);

  const tiposDaTela: AuraTipoItem[] = tipo === "todos" ? TIPOS : [tipo];

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const listas = await Promise.all(
        (tipo === "todos" ? TIPOS : [tipo]).map((t) => listarItensAura(t))
      );

      setItens(
        listas
          .flat()
          .sort(
            (a, b) =>
              new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime()
          )
      );
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setCarregando(false);
    }
  }, [tipo]);

  useEffect(() => {
    setAberto(null);
    setEditando(false);
    setCriando(false);
    setBusca("");
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();

    if (!q) return itens;

    return itens.filter(
      (i) =>
        i.titulo.toLowerCase().includes(q) ||
        i.conteudo.toLowerCase().includes(q)
    );
  }, [itens, busca]);

  function abrir(item: AuraItem) {
    setAberto(item);
    setEditando(false);
    setConfirmarExcluir(false);
    setErro("");
  }

  function comecarEdicao() {
    if (!aberto) return;

    setRascunhoTitulo(aberto.titulo);
    setRascunhoConteudo(aberto.conteudo);
    setEditando(true);
  }

  async function salvarEdicao() {
    if (!aberto || ocupado) return;

    setOcupado(true);
    setErro("");

    try {
      const atualizado = await atualizarItemAura(
        aberto.id,
        rascunhoTitulo,
        rascunhoConteudo
      );

      setItens((anterior) =>
        anterior.map((i) => (i.id === atualizado.id ? atualizado : i))
      );
      setAberto(atualizado);
      setEditando(false);
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setOcupado(false);
    }
  }

  async function excluir() {
    if (!aberto || ocupado) return;

    setOcupado(true);
    setErro("");

    try {
      await excluirItemAura(aberto.id);
      setItens((anterior) => anterior.filter((i) => i.id !== aberto.id));
      setAberto(null);
      setConfirmarExcluir(false);
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setOcupado(false);
    }
  }

  function aoSalvarNovo(item: AuraItem) {
    setItens((anterior) => [item, ...anterior]);
    setCriando(false);
    abrir(item);
  }

  return (
    <div className="ap-pagina">
      <header className="ap-cabecalho">
        <div>
          <h2>{titulo}</h2>
          <p>{descricao}</p>
        </div>

        {tipo !== "todos" && !aberto && !criando && (
          <button
            type="button"
            className="ap-botao primario"
            onClick={() => setCriando(true)}
          >
            <Plus size={14} /> Novo
          </button>
        )}
      </header>

      {erro && <p className="ap-erro">{erro}</p>}

      {criando && tipo !== "todos" ? (
        <FormNovoItem
          tipo={tipo}
          onCancelar={() => setCriando(false)}
          onSalvo={aoSalvarNovo}
        />
      ) : aberto ? (
        <article className="ap-leitor">
          <div className="ap-leitor-topo">
            <button
              type="button"
              className="ap-botao"
              onClick={() => setAberto(null)}
            >
              ← Voltar
            </button>

            <div className="ap-leitor-acoes">
              {!editando && (
                <>
                  <MenuBaixarAura
                    variante="botao"
                    titulo={aberto.titulo}
                    conteudo={aberto.conteudo}
                  />

                  <button
                    type="button"
                    className="ap-botao"
                    onClick={comecarEdicao}
                  >
                    <Pencil size={13} /> Editar
                  </button>
                </>
              )}

              {confirmarExcluir ? (
                <>
                  <button
                    type="button"
                    className="ap-botao perigo"
                    disabled={ocupado}
                    onClick={excluir}
                  >
                    Confirmar exclusão
                  </button>

                  <button
                    type="button"
                    className="ap-botao"
                    onClick={() => setConfirmarExcluir(false)}
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="ap-botao"
                  onClick={() => setConfirmarExcluir(true)}
                >
                  <Trash2 size={13} /> Excluir
                </button>
              )}
            </div>
          </div>

          {editando ? (
            <div className="ap-edicao">
              <input
                value={rascunhoTitulo}
                maxLength={120}
                onChange={(e) => setRascunhoTitulo(e.target.value)}
                aria-label="Título"
              />

              <textarea
                value={rascunhoConteudo}
                onChange={(e) => setRascunhoConteudo(e.target.value)}
                aria-label="Conteúdo"
                rows={16}
              />

              <div className="ap-modal-acoes">
                <button
                  type="button"
                  className="ap-botao"
                  onClick={() => setEditando(false)}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="ap-botao primario"
                  disabled={
                    ocupado ||
                    !rascunhoTitulo.trim() ||
                    !rascunhoConteudo.trim()
                  }
                  onClick={salvarEdicao}
                >
                  {ocupado ? "Salvando" : "Salvar alterações"}
                </button>
              </div>
            </div>
          ) : (
            <>
              <h3 className="ap-leitor-titulo">{aberto.titulo}</h3>

              <p className="ap-meta">
                {ROTULO_TIPO[aberto.tipo]} · {formatarData(aberto.criadoEm)}
              </p>

              <div className="ap-markdown">
                {renderAuraMarkdown(aberto.conteudo)}
              </div>
            </>
          )}
        </article>
      ) : (
        <>
          {comGerador && <GeradorDeProva onSalvo={aoSalvarNovo} />}

          <label className="ap-busca">
            <Search size={14} />
            <input
              value={busca}
              placeholder="Buscar nos itens salvos"
              onChange={(e) => setBusca(e.target.value)}
              aria-label="Buscar nos itens salvos"
            />
          </label>

          {carregando ? (
            <p className="ap-vazio">
              <Loader2 size={15} className="ap-gira" /> Carregando
            </p>
          ) : filtrados.length === 0 ? (
            <p className="ap-vazio">
              {itens.length === 0 ? vazio : "Nenhum item encontrado."}
            </p>
          ) : (
            <ul className="ap-lista">
              {filtrados.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    className="ap-item"
                    onClick={() => abrir(item)}
                  >
                    <span className="ap-item-titulo">{item.titulo}</span>

                    <span className="ap-item-meta">
                      {tiposDaTela.length > 1
                        ? `${ROTULO_TIPO[item.tipo]} · `
                        : ""}
                      {formatarData(item.criadoEm)}
                    </span>

                    <span className="ap-item-previa">
                      {item.conteudo.replace(/[#*_`>\-]/g, "").slice(0, 140)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/* ---------- criar item manualmente ---------- */

function FormNovoItem({
  tipo,
  onCancelar,
  onSalvo,
}: {
  tipo: AuraTipoItem;
  onCancelar: () => void;
  onSalvo: (item: AuraItem) => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");

  async function salvar(evento: FormEvent) {
    evento.preventDefault();

    if (ocupado) return;

    setOcupado(true);
    setErro("");

    try {
      onSalvo(await criarItemAura({ tipo, titulo, conteudo }));
    } catch (e) {
      setErro(mensagemDeErro(e));
      setOcupado(false);
    }
  }

  return (
    <form className="ap-edicao" onSubmit={salvar}>
      <input
        value={titulo}
        maxLength={120}
        placeholder="Título"
        onChange={(e) => setTitulo(e.target.value)}
        aria-label="Título"
        autoFocus
      />

      <textarea
        value={conteudo}
        placeholder="Escreva ou cole o conteúdo (aceita Markdown)"
        onChange={(e) => setConteudo(e.target.value)}
        aria-label="Conteúdo"
        rows={14}
      />

      {erro && <p className="ap-erro">{erro}</p>}

      <div className="ap-modal-acoes">
        <button type="button" className="ap-botao" onClick={onCancelar}>
          Cancelar
        </button>

        <button
          type="submit"
          className="ap-botao primario"
          disabled={ocupado || !titulo.trim() || !conteudo.trim()}
        >
          {ocupado ? "Salvando" : "Salvar"}
        </button>
      </div>
    </form>
  );
}

/* ---------- gerador de provas e exercícios ---------- */

const FORMATOS = {
  multipla: "múltipla escolha (A a D)",
  dissertativa: "dissertativas",
  mista: "mistas (múltipla escolha e dissertativas)",
} as const;

const NIVEIS = {
  fundamental: "Ensino Fundamental",
  medio: "Ensino Médio",
  superior: "Ensino Superior",
} as const;

function GeradorDeProva({ onSalvo }: { onSalvo: (item: AuraItem) => void }) {
  const [tema, setTema] = useState("");
  const [quantidade, setQuantidade] = useState(10);
  const [formato, setFormato] = useState<keyof typeof FORMATOS>("multipla");
  const [nivel, setNivel] = useState<keyof typeof NIVEIS>("medio");
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState("");
  const [resultado, setResultado] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function gerar(evento: FormEvent) {
    evento.preventDefault();

    const assunto = tema.trim();

    if (!assunto || gerando) return;

    setGerando(true);
    setErro("");
    setResultado("");

    const prompt =
      `Crie uma prova com ${quantidade} questões ${FORMATOS[formato]} ` +
      `sobre "${assunto}", para o ${NIVEIS[nivel]}. ` +
      `Numere as questões e coloque o GABARITO comentado no final, em uma seção "## Gabarito". ` +
      `Responda só com a prova, sem introdução e sem fazer perguntas: crie agora.`;

    try {
      const resposta = await perguntarAura(prompt, []);
      setResultado(resposta.resposta.trim());
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setGerando(false);
    }
  }

  async function salvar() {
    if (!resultado || salvando) return;

    setSalvando(true);
    setErro("");

    try {
      const item = await criarItemAura({
        tipo: "prova",
        titulo: `Prova: ${tema.trim()}`.slice(0, 120),
        conteudo: resultado,
      });

      setResultado("");
      setTema("");
      onSalvo(item);
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="ap-gerador">
      <h3>
        <Sparkles size={15} /> Gerar com a AURA
      </h3>

      <form onSubmit={gerar} className="ap-gerador-form">
        <label className="ap-campo">
          <span>Tema</span>
          <input
            value={tema}
            maxLength={200}
            placeholder="Ex.: Teorias de Piaget e Vygotsky"
            onChange={(e) => setTema(e.target.value)}
          />
        </label>

        <div className="ap-linha">
          <label className="ap-campo">
            <span>Questões</span>
            <select
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
            >
              {[5, 10, 15, 20].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>

          <label className="ap-campo">
            <span>Formato</span>
            <select
              value={formato}
              onChange={(e) =>
                setFormato(e.target.value as keyof typeof FORMATOS)
              }
            >
              <option value="multipla">Múltipla escolha</option>
              <option value="dissertativa">Dissertativa</option>
              <option value="mista">Mista</option>
            </select>
          </label>

          <label className="ap-campo">
            <span>Nível</span>
            <select
              value={nivel}
              onChange={(e) =>
                setNivel(e.target.value as keyof typeof NIVEIS)
              }
            >
              <option value="fundamental">Fundamental</option>
              <option value="medio">Médio</option>
              <option value="superior">Superior</option>
            </select>
          </label>
        </div>

        <button
          type="submit"
          className="ap-botao primario"
          disabled={gerando || !tema.trim()}
        >
          {gerando ? (
            <>
              <Loader2 size={14} className="ap-gira" /> Gerando
            </>
          ) : (
            <>
              <FilePenLine size={14} /> Gerar prova
            </>
          )}
        </button>
      </form>

      {erro && <p className="ap-erro">{erro}</p>}

      {resultado && (
        <div className="ap-previa">
          <div className="ap-markdown">{renderAuraMarkdown(resultado)}</div>

          <div className="ap-modal-acoes">
            <MenuBaixarAura
              variante="botao"
              titulo={`Prova ${tema.trim()}`}
              conteudo={resultado}
            />

            <button
              type="button"
              className="ap-botao"
              onClick={() => setResultado("")}
            >
              Descartar
            </button>

            <button
              type="button"
              className="ap-botao primario"
              disabled={salvando}
              onClick={salvar}
            >
              <Bookmark size={14} /> {salvando ? "Salvando" : "Salvar prova"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

/* ---------- configurações ---------- */

const PADRAO: AuraConfig = {
  tom: "equilibrado",
  nivel: "intermediario",
  tamanho: "media",
  instrucoes: "",
};

type Escolhas<K extends keyof AuraConfig> = ReadonlyArray<{
  valor: AuraConfig[K];
  rotulo: string;
}>;

const TONS: Escolhas<"tom"> = [
  { valor: "equilibrado", rotulo: "Equilibrado" },
  { valor: "formal", rotulo: "Formal" },
  { valor: "descontraido", rotulo: "Descontraído" },
];

const NIVEIS_RESPOSTA: Escolhas<"nivel"> = [
  { valor: "simples", rotulo: "Simples" },
  { valor: "intermediario", rotulo: "Intermediário" },
  { valor: "avancado", rotulo: "Avançado" },
];

const TAMANHOS: Escolhas<"tamanho"> = [
  { valor: "curta", rotulo: "Curta" },
  { valor: "media", rotulo: "Média" },
  { valor: "detalhada", rotulo: "Detalhada" },
];

export function PainelConfigAura() {
  const [config, setConfig] = useState<AuraConfig>(PADRAO);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;

    lerConfigAura()
      .then((c) => {
        if (ativo) setConfig(c);
      })
      .catch((e) => {
        if (ativo) setErro(mensagemDeErro(e));
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, []);

  async function salvar() {
    if (salvando) return;

    setSalvando(true);
    setErro("");
    setMensagem("");

    try {
      setConfig(await salvarConfigAura(config));
      setMensagem("Configurações salvas. Valem a partir da próxima resposta.");
    } catch (e) {
      setErro(mensagemDeErro(e));
    } finally {
      setSalvando(false);
    }
  }

  function grupo<K extends "tom" | "nivel" | "tamanho">(
    campo: K,
    titulo: string,
    opcoes: Escolhas<K>
  ) {
    return (
      <div className="ap-campo">
        <span>{titulo}</span>

        <div className="ap-opcoes">
          {opcoes.map((o) => (
            <button
              key={o.valor}
              type="button"
              className={`ap-opcao ${config[campo] === o.valor ? "ativa" : ""}`}
              onClick={() =>
                setConfig({ ...config, [campo]: o.valor } as AuraConfig)
              }
            >
              {o.rotulo}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="ap-pagina">
      <header className="ap-cabecalho">
        <div>
          <h2>Configurações</h2>
          <p>Como a AURA deve responder para você.</p>
        </div>
      </header>

      {carregando ? (
        <p className="ap-vazio">
          <Loader2 size={15} className="ap-gira" /> Carregando
        </p>
      ) : (
        <div className="ap-config">
          {grupo("tom", "Tom das respostas", TONS)}
          {grupo("nivel", "Nível da explicação", NIVEIS_RESPOSTA)}
          {grupo("tamanho", "Tamanho das respostas", TAMANHOS)}

          <label className="ap-campo">
            <span>Pedido extra (opcional)</span>
            <textarea
              value={config.instrucoes}
              maxLength={300}
              rows={3}
              placeholder="Ex.: Sempre relacione o conteúdo com a BNCC."
              onChange={(e) =>
                setConfig({ ...config, instrucoes: e.target.value })
              }
            />
            <small>{config.instrucoes.length}/300</small>
          </label>

          <div className="ap-campo">
            <span>Memória</span>
            <p className="ap-ajuda">
              A AURA aprende suas preferências de estudo conforme vocês
              conversam. No chat, use <code>/memoria</code> para ver,{" "}
              <code>/esquecer</code> para apagar, <code>/pausar-memoria</code>{" "}
              e <code>/ativar-memoria</code> para ligar e desligar.
            </p>
          </div>

          {erro && <p className="ap-erro">{erro}</p>}
          {mensagem && <p className="ap-ok">{mensagem}</p>}

          <div className="ap-modal-acoes">
            <button
              type="button"
              className="ap-botao"
              onClick={() => setConfig(PADRAO)}
            >
              Restaurar padrão
            </button>

            <button
              type="button"
              className="ap-botao primario"
              disabled={salvando}
              onClick={salvar}
            >
              {salvando ? "Salvando" : "Salvar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- baixar: PDF, Markdown e PDF só com as questões ---------- */

export function MenuBaixarAura({
  titulo,
  conteudo,
  variante = "icone",
}: {
  titulo: string;
  conteudo: string;
  variante?: "icone" | "botao";
}) {
  const [aberto, setAberto] = useState(false);
  const [erro, setErro] = useState("");

  const { questoes, gabarito } = useMemo(
    () => separarGabarito(conteudo),
    [conteudo]
  );

  useEffect(() => {
    if (!aberto) return;

    const fechar = () => setAberto(false);

    document.addEventListener("click", fechar);

    return () => document.removeEventListener("click", fechar);
  }, [aberto]);

  function executar(acao: () => void) {
    try {
      acao();
      setErro("");
      setAberto(false);
    } catch {
      setErro("Não foi possível gerar o arquivo.");
    }
  }

  const nome = titulo.trim() || "AURA";

  return (
    <span className="ap-baixar" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        className={
          variante === "botao" ? "ap-botao" : "aura-message-action"
        }
        aria-label="Baixar"
        aria-expanded={aberto}
        onClick={() => setAberto((v) => !v)}
      >
        <Download size={variante === "botao" ? 13 : 14} />
        {variante === "botao" && " Baixar"}
      </button>

      {aberto && (
        <div className="ap-baixar-menu" role="menu">
          <button
            type="button"
            role="menuitem"
            onClick={() => executar(() => baixarPdf(nome, conteudo))}
          >
            PDF completo
          </button>

          {gabarito && (
            <>
              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  executar(() => baixarPdf(nome, questoes, "-questoes"))
                }
              >
                PDF só com as questões
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={() =>
                  executar(() => baixarPdf(nome, gabarito, "-gabarito"))
                }
              >
                PDF só com o gabarito
              </button>
            </>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => executar(() => baixarMarkdown(nome, conteudo))}
          >
            Texto Markdown (.md)
          </button>

          {erro && <span className="ap-erro-mini">{erro}</span>}
        </div>
      )}
    </span>
  );
}

/* ---------- cartão de perguntas de auditoria da AURA ---------- */

export function CartaoPerguntasAura({
  perguntas,
  onEnviar,
}: {
  perguntas: PerguntaAura[];
  onEnviar: (texto: string) => void;
}) {
  const [respostas, setRespostas] = useState<string[]>(() =>
    perguntas.map(() => "")
  );
  const [enviado, setEnviado] = useState(false);

  function escolher(indice: number, valor: string) {
    setRespostas((anterior) =>
      anterior.map((r, i) =>
        i === indice ? (r === valor ? "" : valor) : r
      )
    );
  }

  function digitar(indice: number, valor: string) {
    setRespostas((anterior) =>
      anterior.map((r, i) => (i === indice ? valor : r))
    );
  }

  function enviar(decidirSozinha: boolean) {
    if (enviado) return;

    setEnviado(true);

    onEnviar(
      decidirSozinha
        ? montarRespostas(perguntas, perguntas.map(() => ""))
        : montarRespostas(perguntas, respostas)
    );
  }

  return (
    <div className="ap-perguntas" aria-label="Perguntas da AURA">
      {perguntas.map((p, i) => (
        <fieldset key={i} className="ap-pergunta" disabled={enviado}>
          <legend>
            {i + 1}. {p.pergunta}
          </legend>

          <div className="ap-opcoes">
            {p.opcoes.map((o) => (
              <button
                key={o}
                type="button"
                className={`ap-opcao ${respostas[i] === o ? "ativa" : ""}`}
                onClick={() => escolher(i, o)}
              >
                {o}
              </button>
            ))}
          </div>

          <input
            value={p.opcoes.includes(respostas[i]) ? "" : respostas[i]}
            maxLength={160}
            placeholder="Ou escreva a sua resposta"
            aria-label={`Resposta livre da pergunta ${i + 1}`}
            onChange={(e) => digitar(i, e.target.value)}
          />
        </fieldset>
      ))}

      <div className="ap-modal-acoes">
        <button
          type="button"
          className="ap-botao"
          disabled={enviado}
          onClick={() => enviar(true)}
        >
          Decida você
        </button>

        <button
          type="button"
          className="ap-botao primario"
          disabled={enviado || respostas.every((r) => !r.trim())}
          onClick={() => enviar(false)}
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
