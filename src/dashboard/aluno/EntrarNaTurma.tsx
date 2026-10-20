import { useId, useState, type FormEvent } from "react";
import { Plus } from "lucide-react";
import { Aviso } from "../comuns";
import { useAluno } from "./AlunoDados";
import { normalizarCodigo } from "./logica";

/* Entrar em turma com o código que o professor passou. Valida no servidor; aqui só orienta. */
export default function EntrarNaTurma({ titulo = "Entrar em uma turma" }: { titulo?: string }) {
  const { entrarNaTurma } = useAluno();
  const id = useId();
  const [codigo, setCodigo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);

  const valido = codigo.length >= 4;

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valido || ocupado) return;
    setOcupado(true);
    setAviso(null);
    try {
      const turma = await entrarNaTurma(codigo);
      setCodigo("");
      setAviso({ tipo: "sucesso", texto: `Você entrou em ${turma.disciplina} — ${turma.nome}.` });
    } catch (erro) {
      setAviso({ tipo: "erro", texto: erro instanceof Error ? erro.message : "Não foi possível entrar na turma." });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <section className="edc-cartao" aria-labelledby={`${id}-t`}>
      <h2 id={`${id}-t`}>{titulo}</h2>
      <form className="edc-form" onSubmit={enviar} noValidate>
        <div className="edc-campo">
          <label htmlFor={id}>Código da turma</label>
          <input
            id={id}
            className="edc-entrada edc-entrada-codigo"
            value={codigo}
            onChange={(e) => setCodigo(normalizarCodigo(e.target.value))}
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            maxLength={12}
            placeholder="EX: K7M2QP"
            aria-describedby={`${id}-ajuda`}
          />
          <small id={`${id}-ajuda`}>Peça o código ao seu professor. Ele tem de 4 a 12 letras e números.</small>
        </div>
        <button type="submit" className="edc-btn edc-btn-primario" disabled={!valido || ocupado}>
          <Plus aria-hidden="true" size={16} /> {ocupado ? "Entrando…" : "Entrar na turma"}
        </button>
        {aviso ? <Aviso tipo={aviso.tipo}>{aviso.texto}</Aviso> : null}
      </form>
    </section>
  );
}
