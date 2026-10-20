import type { User } from "firebase/auth";

/* Camada 1 — backend próprio da plataforma (Vercel + Neon).
   O papel real e a verificação do e-mail vêm SEMPRE do servidor; o navegador só pergunta. */

export type Papel = "aluno" | "professor";

export const rotaDoPapel = (papel: Papel) => `/app/dashboard/${papel}`;

export const nomeDoPapel = (papel: Papel) => (papel === "professor" ? "Professor" : "Aluno");

export class ErroPlataforma extends Error {
  codigo: string;
  papelReal: Papel | null;

  constructor(mensagem: string, codigo: string, papelReal: Papel | null = null) {
    super(mensagem);
    this.codigo = codigo;
    this.papelReal = papelReal;
  }
}

const ehPapel = (v: unknown): v is Papel => v === "aluno" || v === "professor";

async function chamar(user: User, caminho: string, init: RequestInit, forcarToken = false) {
  const token = await user.getIdToken(forcarToken);

  let resposta: Response;
  try {
    resposta = await fetch(caminho, {
      ...init,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new ErroPlataforma("Não foi possível conectar ao servidor. Verifique sua internet.", "NETWORK");
  }

  const corpo = await resposta.json().catch(() => ({}));

  // As APIs respondem { erro | error, codigo | code }.
  if (!resposta.ok || corpo?.sucesso === false) {
    const mensagem = corpo?.erro ?? corpo?.error;
    const codigo = corpo?.codigo ?? corpo?.code;

    throw new ErroPlataforma(
      typeof mensagem === "string" ? mensagem : "Não foi possível validar sua conta.",
      typeof codigo === "string" ? codigo : "UNKNOWN",
      ehPapel(corpo?.papelReal) ? corpo.papelReal : null,
    );
  }

  return corpo;
}

/* O token guarda `email_verified` do momento em que foi emitido. Se o servidor disser que o e-mail
   não está verificado, relê a conta e tenta UMA vez com token novo (a pessoa pode ter acabado de
   clicar no link). */
export async function chamarVerificado(user: User, caminho: string, init: RequestInit) {
  try {
    return await chamar(user, caminho, init);
  } catch (erro) {
    if (erro instanceof ErroPlataforma && erro.codigo === "EMAIL_NOT_VERIFIED") {
      await user.reload().catch(() => undefined);
      if (user.emailVerified) return chamar(user, caminho, init, true);
    }
    throw erro;
  }
}

/** Consulta o papel real da conta. `null` = ainda não definido. */
export async function buscarPapel(user: User) {
  const corpo = await chamarVerificado(user, "/api/usuario", { method: "GET" });
  return ehPapel(corpo?.papel) ? corpo.papel : null;
}

/** Define o papel (só na primeira vez) ou confirma o existente; conta do outro papel -> ROLE_MISMATCH.
    Renova o token para o claim do Firebase (camada 2) chegar ao navegador. */
export async function vincularPapel(user: User, papel: Papel) {
  const corpo = await chamarVerificado(user, "/api/usuario", {
    method: "POST",
    body: JSON.stringify({ papel }),
  });

  await user.getIdToken(true);
  return ehPapel(corpo?.papel) ? corpo.papel : papel;
}

/** Envia (ou reenvia) o e-mail de confirmação. No cadastro, `papel` faz o servidor registrar a
    escolha ANTES da verificação; depois disso a conta não pode assumir o outro papel. */
export async function enviarVerificacao(user: User, papel?: Papel) {
  await chamar(user, "/api/enviar-verificacao", {
    method: "POST",
    body: JSON.stringify(papel ? { papel } : {}),
  });
}
