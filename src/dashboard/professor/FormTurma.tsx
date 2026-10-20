import { useId, useState, type FormEvent } from "react";
import { Aviso } from "../comuns";
import { validarTurma, type FormTurma } from "./logica";

type Props = {
  inicial: FormTurma;
  rotuloEnviar: string;
  onEnviar: (dados: { nome: string; disciplina: string; anoLetivo: string; descricao: string }) => Promise<void>;
  onCancelar?: () => void;
};

/* Criar/editar turma. Valida igual ao servidor para orientar; o servidor continua sendo a palavra final. */
export default function FormularioTurma({ inicial, rotuloEnviar, onEnviar, onCancelar }: Props) {
  const id = useId();
  const [f, setF] = useState<FormTurma>(inicial);
  const [erros, setErros] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState(false);
  const [erroGeral, setErroGeral] = useState<string | null>(null);

  const mudar = (campo: keyof FormTurma) => (e: { target: { value: string } }) => setF((a) => ({ ...a, [campo]: e.target.value }));

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (ocupado) return;
    const v = validarTurma(f);
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
      setErroGeral(erro instanceof Error ? erro.message : "Não foi possível salvar a turma.");
    } finally {
      setOcupado(false);
    }
  }

  const campo = (nome: keyof FormTurma, rotulo: string, extra: { obrigatorio?: boolean; ajuda?: string; max: number; area?: boolean }) => {
    const cid = `${id}-${nome}`;
    const erro = erros[nome];
    const descr = [extra.ajuda ? `${cid}-a` : "", erro ? `${cid}-e` : ""].filter(Boolean).join(" ") || undefined;
    const props = {
      id: cid,
      value: f[nome],
      onChange: mudar(nome),
      maxLength: extra.max,
      "aria-invalid": erro ? true : undefined,
      "aria-describedby": descr,
      "aria-required": extra.obrigatorio ? true : undefined,
    };
    return (
      <div className="edc-campo">
        <label htmlFor={cid}>
          {rotulo}
          {extra.obrigatorio ? <span className="edc-obrigatorio"> (obrigatório)</span> : null}
        </label>
        {extra.area ? <textarea className="edc-area edc-area-curta" {...props} /> : <input className="edc-entrada" {...props} />}
        {extra.ajuda ? <small id={`${cid}-a`}>{extra.ajuda}</small> : null}
        {erro ? (
          <small id={`${cid}-e`} className="edc-erro-campo">
            {erro}
          </small>
        ) : null}
      </div>
    );
  };

  return (
    <form className="edc-form" onSubmit={enviar} noValidate>
      {campo("nome", "Nome da turma", { obrigatorio: true, max: 120, ajuda: "Ex.: 7º ano A" })}
      {campo("disciplina", "Disciplina", { obrigatorio: true, max: 120, ajuda: "Ex.: Matemática" })}
      {campo("anoLetivo", "Ano letivo", { max: 20, ajuda: "Opcional. Ex.: 2026" })}
      {campo("descricao", "Descrição", { max: 1000, area: true, ajuda: "Opcional. Aparece só para você." })}
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
