import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Bookmark, Download, FileText, Pencil, Send, X } from "lucide-react";
import {
  baixarMarkdown,
  baixarPdf,
  paginasParaPrevia,
  separarGabarito,
  type PaginaPrevia,
} from "../lib/aura-export";
import { rotuloDoTipo, type DocumentoDetectado } from "../lib/aura-documento";
import "../styles/aura-documento.css";

/* ---------- cartão que aparece abaixo da resposta ---------- */

export function CartaoDocumentoAura({
  documento,
  ativo,
  onAbrir,
}: {
  documento: DocumentoDetectado;
  ativo: boolean;
  onAbrir: () => void;
}) {
  return (
    <div className={`ad-cartao${ativo ? " ativo" : ""}`}>
      <div className="ad-cartao-icone" aria-hidden="true">
        <FileText size={20} />
      </div>

      <div className="ad-cartao-info">
        <strong title={documento.titulo}>{documento.titulo}</strong>
        <span>
          {rotuloDoTipo(documento.tipo)} • PDF e Markdown
          {documento.temGabarito ? " • com gabarito" : ""}
        </span>
      </div>

      <button type="button" className="ad-cartao-botao" onClick={onAbrir}>
        <span className="ad-cartao-pdf">PDF</span>
        {ativo ? "Aberto" : "Visualizar"}
      </button>
    </div>
  );
}

/* ---------- desenho das páginas (mesma diagramação do PDF) ---------- */

function PaginaCanvas({ pagina, largura }: { pagina: PaginaPrevia; largura: number }) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const k = largura / pagina.largura;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);

    canvas.width = Math.round(largura * dpr);
    canvas.height = Math.round(pagina.altura * k * dpr);
    ctx.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, pagina.largura, pagina.altura);

    for (const op of pagina.ops) {
      if (op.t === "linha") {
        ctx.strokeStyle = op.cor;
        ctx.lineWidth = op.w;
        ctx.beginPath();
        ctx.moveTo(op.x1, pagina.altura - op.y);
        ctx.lineTo(op.x2, pagina.altura - op.y);
        ctx.stroke();
        continue;
      }

      const familia =
        op.fonte === "F3" ? '"Courier New", Courier, monospace' : 'Helvetica, Arial, "Liberation Sans", sans-serif';
      ctx.font = `${op.fonte === "F2" ? "bold " : ""}${op.corpo}px ${familia}`;
      ctx.fillStyle = op.cinza ? "#737373" : "#111111";
      ctx.textBaseline = "alphabetic";
      ctx.fillText(op.s, op.x, pagina.altura - op.y);
    }
  }, [pagina, largura]);

  return <canvas ref={ref} className="ad-pagina" style={{ width: largura, height: pagina.altura * (largura / pagina.largura) }} />;
}

type Parte = "tudo" | "questoes" | "gabarito";

/* ---------- painel lateral ---------- */

export function PainelDocumentoAura({
  titulo,
  conteudo,
  editado,
  onEditar,
  onRestaurar,
  onPedirAjuste,
  onSalvar,
  onFechar,
}: {
  titulo: string;
  conteudo: string;
  editado: boolean;
  onEditar: (novo: string) => void;
  onRestaurar: () => void;
  onPedirAjuste: (pedido: string) => void;
  onSalvar: () => void;
  onFechar: () => void;
}) {
  const [aba, setAba] = useState<"pdf" | "markdown">("pdf");
  const [parte, setParte] = useState<Parte>("tudo");
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(conteudo);
  const [ajuste, setAjuste] = useState("");
  const [largura, setLargura] = useState(520);
  const areaRef = useRef<HTMLDivElement | null>(null);

  const { questoes, gabarito } = useMemo(() => separarGabarito(conteudo), [conteudo]);
  const temPartes = gabarito !== null;

  // Se o gabarito sumiu (edição), volta para o documento todo.
  useEffect(() => {
    if (!temPartes && parte !== "tudo") setParte("tudo");
  }, [temPartes, parte]);

  useEffect(() => {
    if (!editando) setRascunho(conteudo);
  }, [conteudo, editando]);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;

    const medir = () => setLargura(Math.max(240, Math.min(820, el.clientWidth - 32)));
    medir();

    if (typeof ResizeObserver === "undefined") return;
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, [aba]);

  const textoDaParte = parte === "questoes" ? questoes : parte === "gabarito" ? gabarito || "" : conteudo;
  const tituloDaParte =
    parte === "questoes" ? `${titulo} (questões)` : parte === "gabarito" ? `${titulo} (gabarito)` : titulo;

  const paginas = useMemo(
    () => (aba === "pdf" ? paginasParaPrevia(tituloDaParte, textoDaParte) : []),
    [aba, tituloDaParte, textoDaParte]
  );

  function baixar() {
    baixarPdf(titulo, textoDaParte, parte === "questoes" ? " questoes" : parte === "gabarito" ? " gabarito" : "");
  }

  function enviarAjuste(evento: FormEvent) {
    evento.preventDefault();
    const pedido = ajuste.trim();
    if (!pedido) return;
    onPedirAjuste(pedido);
    setAjuste("");
  }

  function aplicarEdicao() {
    onEditar(rascunho);
    setEditando(false);
  }

  return (
    <aside className="ad-painel" aria-label={`Visualizador: ${titulo}`}>
      <header className="ad-topo">
        <div className="ad-topo-titulo">
          <FileText size={16} aria-hidden="true" />
          <strong title={titulo}>{titulo}</strong>
          {editado && <em className="ad-editado">editado</em>}
        </div>

        <button type="button" className="ad-icone" onClick={onFechar} aria-label="Fechar visualizador">
          <X size={18} />
        </button>
      </header>

      <div className="ad-barra">
        <div className="ad-abas" role="tablist">
          <button type="button" role="tab" aria-selected={aba === "pdf"} className={aba === "pdf" ? "on" : ""} onClick={() => setAba("pdf")}>
            PDF
          </button>
          <button type="button" role="tab" aria-selected={aba === "markdown"} className={aba === "markdown" ? "on" : ""} onClick={() => setAba("markdown")}>
            Markdown
          </button>
        </div>

        {aba === "pdf" && temPartes && (
          <div className="ad-partes" role="group" aria-label="Parte do documento">
            {([
              ["tudo", "Completo"],
              ["questoes", "Só questões"],
              ["gabarito", "Só gabarito"],
            ] as [Parte, string][]).map(([id, rotulo]) => (
              <button key={id} type="button" className={parte === id ? "on" : ""} onClick={() => setParte(id)}>
                {rotulo}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ad-area" ref={areaRef}>
        {aba === "pdf" ? (
          <div className="ad-paginas">
            {paginas.map((p, i) => (
              <PaginaCanvas key={i} pagina={p} largura={largura} />
            ))}
          </div>
        ) : editando ? (
          <textarea
            className="ad-editor"
            value={rascunho}
            onChange={(e) => setRascunho(e.target.value)}
            spellCheck
            aria-label="Editar texto do documento"
          />
        ) : (
          <pre className="ad-md">{conteudo}</pre>
        )}
      </div>

      <footer className="ad-rodape">
        {aba === "markdown" && (
          <div className="ad-linha">
            {editando ? (
              <>
                <button type="button" className="ad-btn primario" onClick={aplicarEdicao}>
                  Aplicar edição
                </button>
                <button type="button" className="ad-btn" onClick={() => { setRascunho(conteudo); setEditando(false); }}>
                  Cancelar
                </button>
              </>
            ) : (
              <>
                <button type="button" className="ad-btn" onClick={() => setEditando(true)}>
                  <Pencil size={14} /> Editar o texto
                </button>
                {editado && (
                  <button type="button" className="ad-btn" onClick={onRestaurar}>
                    Voltar ao original
                  </button>
                )}
              </>
            )}
          </div>
        )}

        <form className="ad-ajuste" onSubmit={enviarAjuste}>
          <input
            value={ajuste}
            onChange={(e) => setAjuste(e.target.value)}
            placeholder="Pedir ajuste à AURA (ex.: deixe mais difícil)"
            maxLength={500}
            aria-label="Pedir ajuste à AURA"
          />
          <button type="submit" className="ad-icone" disabled={!ajuste.trim()} aria-label="Enviar pedido de ajuste">
            <Send size={16} />
          </button>
        </form>

        <div className="ad-linha">
          <button type="button" className="ad-btn primario" onClick={baixar}>
            <Download size={14} className="ad-seta" /> Baixar PDF
          </button>
          <button type="button" className="ad-btn" onClick={() => baixarMarkdown(titulo, conteudo)}>
            Baixar .md
          </button>
          <button type="button" className="ad-btn" onClick={onSalvar}>
            <Bookmark size={14} /> Salvar na biblioteca
          </button>
        </div>
      </footer>
    </aside>
  );
}
