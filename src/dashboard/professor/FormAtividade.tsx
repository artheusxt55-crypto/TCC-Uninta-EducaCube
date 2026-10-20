import { useId, useState, type FormEvent } from "react";
import { Aviso } from "../comuns";
import type { DadosAtividade } from "../../lib/api-plataforma";
import { validarAtividade, type FormAtividade } from "./logica";

type Props = {
  inicial: FormAtividade;
  rotuloEnviar: string;
  onEnviar: (dados: DadosAtividade) => Promise<void>;
  onCancelar?: () => void;
};

/* Criar/editar atividade ou avaliação. */
export default function FormularioAtividade({ inicial, rotuloEnviar, onEnviar, onCancelar }: Props) {
  const id = useId();
  const [f, setF] = useState<FormAtividade>(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const erroDe = (n: string) =>
    erros[n] ? (
      <small id={`${id}-${n}-e`} className="edc-erro-campo">
        {erros[n]}
      </small>
    ) : null;
  const invalido = (n: string) => ({ "aria-invalid": erros[n] ? true : undefined, "aria-describedby": erros[n] ? `${id}-${n}-e` : undefined });

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (ocupado) return;
    const v = validarAtividade(f);
    if (!v.ok) {
      setErros(v.erros);
      setErroGeral(null);
      return;
    }
    setErros({});
    setErroGeral(null);
    setOcupado(true);
    try {
      await onEnviar(v.dados);
    } catch (erro) {
      setErroGeral(erro instanceof Error ? erro.message : "Não foi possível salvar a atividade.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <form className="edc-form" onSubmit={enviar} noValidate>
      <div className="edc-campo">
        <label htmlFor={`${id}-titulo`}>
          Título<span className="edc-obrigatorio"> (obrigatório)</span>
        </label>
        <input
          id={`${id}-titulo`}
          className="edc-entrada"
          value={f.titulo}
          maxLength={160}
          aria-required="true"
          onChange={(e) => setF((a) => ({ ...a, titulo: e.target.value }))}
          {...invalido("titulo")}
        />
        {erroDe("titulo")}
      </div>

      <div className="edc-campo">
        <label htmlFor={`${id}-instr`}>Instruções</label>
        <textarea
          id={`${id}-instr`}
          className="edc-area edc-area-curta"
          value={f.instrucoes}
          maxLength={10000}
          onChange={(e) => setF((a) => ({ ...a, instrucoes: e.target.value }))}
          {...invalido("instrucoes")}
        />
        {erroDe("instrucoes")}
      </div>

      <div className="edc-linha-campos">
        <div className="edc-campo">
          <label htmlFor={`${id}-tipo`}>Tipo</label>
          <select
            id={`${id}-tipo`}
            className="edc-selecao"
            value={f.tipo}
            onChange={(e) => setF((a) => ({ ...a, tipo: e.target.value === "avaliacao" ? "avaliacao" : "atividade" }))}
          >
            <option value="atividade">Atividade</option>
            <option value="avaliacao">Avaliação</option>
          </select>
        </div>

        <div className="edc-campo">
          <label htmlFor={`${id}-pontos`}>Pontuação</label>
          <input
            id={`${id}-pontos`}
            className="edc-entrada"
            inputMode="decimal"
            value={f.pontos}
            onChange={(e) => setF((a) => ({ ...a, pontos: e.target.value }))}
            {...invalido("pontos")}
          />
          {erroDe("pontos")}
        </div>

        <div className="edc-campo">
          <label htmlFor={`${id}-prazo`}>Prazo</label>
          <input
            id={`${id}-prazo`}
            type="datetime-local"
            className="edc-entrada"
            value={f.prazo}
            onChange={(e) => setF((a) => ({ ...a, prazo: e.target.value }))}
            {...invalido("prazo")}
          />
          <small>Deixe em branco para atividade sem prazo.</small>
          {erroDe("prazo")}
        </div>
      </div>

      <label className="edc-check">
        <input type="checkbox" checked={f.publicada} onChange={(e) => setF((a) => ({ ...a, publicada: e.target.checked }))} />
        <span>
          Publicada
          <small>Só atividades publicadas aparecem para os alunos.</small>
        </span>
      </label>

      <div className="edc-acoes-form">
        <button type="submit" className="edc-btn edc-btn-primario" disabled={ocupado}>
          {ocupado ? "Salvando…" : rotuloEnviar}
        </button>
        {onCancelar ? (
          <button type="button" className="edc-btn edc-btn-secundario" onClick={onCancelar} disabled={ocupado}>
            Cancelar
          </button>
        ) : null}
      </div>
      {erroGeral ? <Aviso tipo="erro">{erroGeral}</Aviso> : null}
    </form>
  );
}
