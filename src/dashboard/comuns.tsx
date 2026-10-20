import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Clock, Inbox, RefreshCw, Send } from "lucide-react";
import type { StatusEntrega } from "../lib/api-plataforma";
import { ROTULO_STATUS } from "./aluno/logica";

/* Peças compartilhadas pelos dois dashboards. Nenhuma delas inventa dado: só apresentam o que recebem. */

export function useTitulo(titulo: string) {
  useEffect(() => {
    const anterior = document.title;
    document.title = `${titulo} · EducaCube`;
    return () => {
      document.title = anterior;
    };
  }, [titulo]);
}

export function Cabecalho({ titulo, descricao, acoes }: { titulo: string; descricao?: string; acoes?: ReactNode }) {
  return (
    <header className="edc-cabecalho">
      <div className="edc-cabecalho-texto">
        <h1>{titulo}</h1>
        {descricao ? <p>{descricao}</p> : null}
      </div>
      {acoes ? <div className="edc-cabecalho-acoes">{acoes}</div> : null}
    </header>
  );
}

export function Carregando({ linhas = 3, rotulo = "Carregando…" }: { linhas?: number; rotulo?: string }) {
  return (
    <div className="edc-carregando" role="status" aria-live="polite" aria-busy="true">
      <span className="edc-sr">{rotulo}</span>
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} className="edc-esqueleto" aria-hidden="true" />
      ))}
    </div>
  );
}

export function EstadoErro({ mensagem, onTentar }: { mensagem: string; onTentar?: () => void }) {
  return (
    <div className="edc-estado edc-estado-erro" role="alert">
      <AlertTriangle aria-hidden="true" size={28} />
      <h2>Não foi possível carregar</h2>
      <p>{mensagem}</p>
      {onTentar ? (
        <button type="button" className="edc-btn edc-btn-secundario" onClick={onTentar}>
          <RefreshCw aria-hidden="true" size={16} /> Tentar novamente
        </button>
      ) : null}
    </div>
  );
}

export function EstadoVazio({ titulo, texto, acao }: { titulo: string; texto?: string; acao?: ReactNode }) {
  return (
    <div className="edc-estado">
      <Inbox aria-hidden="true" size={28} />
      <h2>{titulo}</h2>
      {texto ? <p>{texto}</p> : null}
      {acao}
    </div>
  );
}

const ICONE_STATUS = {
  pendente: Clock,
  atrasada: AlertTriangle,
  entregue: Send,
  corrigida: CheckCircle2,
} as const;

/** Status nunca é só cor: sempre ícone + texto. */
export function Selo({ status, rotulo }: { status: StatusEntrega; rotulo?: string }) {
  const Icone = ICONE_STATUS[status];
  return (
    <span className={`edc-selo edc-selo-${status}`}>
      <Icone aria-hidden="true" size={14} />
      {rotulo ?? ROTULO_STATUS[status]}
    </span>
  );
}

/** Barra de progresso. `valor === null` = ainda não há base (mostra traço, não zero). */
export function Barra({ valor, rotulo }: { valor: number | null; rotulo: string }) {
  if (valor === null) {
    return (
      <div className="edc-barra-vazia" aria-label={`${rotulo}: sem dados ainda`}>
        <span className="edc-barra-trilho" aria-hidden="true" />
        <span className="edc-barra-valor">—</span>
      </div>
    );
  }
  return (
    <div className="edc-barra">
      <div
        className="edc-barra-trilho"
        role="progressbar"
        aria-label={rotulo}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={valor}
      >
        <span className="edc-barra-preenchimento" style={{ width: `${valor}%` }} />
      </div>
      <span className="edc-barra-valor">{valor}%</span>
    </div>
  );
}

export function Aviso({ tipo, children }: { tipo: "sucesso" | "erro"; children: ReactNode }) {
  return (
    <p className={`edc-aviso edc-aviso-${tipo}`} role={tipo === "erro" ? "alert" : "status"}>
      {tipo === "erro" ? <AlertTriangle aria-hidden="true" size={16} /> : <CheckCircle2 aria-hidden="true" size={16} />}
      <span>{children}</span>
    </p>
  );
}

/** Ação destrutiva em dois passos, sem `window.confirm`: o primeiro clique só pede confirmação. */
export function ConfirmarAcao({
  rotulo,
  pergunta,
  confirmar,
  onConfirmar,
  ocupado = false,
  icone,
}: {
  rotulo: string;
  pergunta: string;
  confirmar: string;
  onConfirmar: () => void | Promise<void>;
  ocupado?: boolean;
  icone?: ReactNode;
}) {
  const [pedindo, setPedindo] = useState(false);
  const botaoConfirmar = useRef<HTMLButtonElement>(null);
  const botaoInicial = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (pedindo) botaoConfirmar.current?.focus();
  }, [pedindo]);

  if (!pedindo) {
    return (
      <button ref={botaoInicial} type="button" className="edc-btn edc-btn-perigo" onClick={() => setPedindo(true)} disabled={ocupado}>
        {icone} {rotulo}
      </button>
    );
  }

  const cancelar = () => {
    setPedindo(false);
    requestAnimationFrame(() => botaoInicial.current?.focus());
  };

  return (
    <div
      className="edc-confirmar"
      role="group"
      aria-label={pergunta}
      onKeyDown={(e) => {
        if (e.key === "Escape") cancelar();
      }}
    >
      <span className="edc-confirmar-texto">{pergunta}</span>
      <button
        ref={botaoConfirmar}
        type="button"
        className="edc-btn edc-btn-perigo-solido"
        disabled={ocupado}
        onClick={async () => {
          await onConfirmar();
          setPedindo(false);
        }}
      >
        {ocupado ? "Aguarde…" : confirmar}
      </button>
      <button type="button" className="edc-btn edc-btn-secundario" onClick={cancelar} disabled={ocupado}>
        Cancelar
      </button>
    </div>
  );
}
