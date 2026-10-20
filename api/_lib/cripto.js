import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes } from "node:crypto";

/* AES-256-GCM por campo. A chave vive SÓ no backend (DADOS_CHAVE_CRIPTO, 32 bytes em base64).
   Gerar:  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   Formato: enc:v1:<base64url(iv | tag | cifra)>. O "contexto" (ex.: users.email) entra como dado
   autenticado: valor copiado para outra coluna não decifra. Senhas NÃO passam por aqui:
   o Firebase Auth guarda só o hash delas. */

const PREFIXO = "enc:v1:";

function chaveMestra() {
  const b64 = process.env.DADOS_CHAVE_CRIPTO;
  if (!b64) throw new Error("DADOS_CHAVE_CRIPTO não está configurada.");
  const chave = Buffer.from(b64, "base64");
  if (chave.length !== 32) throw new Error("DADOS_CHAVE_CRIPTO deve ter 32 bytes (base64).");
  return chave;
}

const derivar = (info) =>
  Buffer.from(hkdfSync("sha256", chaveMestra(), Buffer.alloc(0), `educacube/${info}`, 32));

export const estaCifrado = (v) => typeof v === "string" && v.startsWith(PREFIXO);

export function cifrar(texto, contexto) {
  if (texto === null || texto === undefined || texto === "") return null;

  const iv = randomBytes(12);
  const cifra = createCipheriv("aes-256-gcm", derivar("cifra"), iv);
  cifra.setAAD(Buffer.from(String(contexto)));

  const dados = Buffer.concat([cifra.update(String(texto), "utf8"), cifra.final()]);
  return PREFIXO + Buffer.concat([iv, cifra.getAuthTag(), dados]).toString("base64url");
}

/** Valores antigos em texto puro passam direto (migração gradual). */
export function decifrar(valor, contexto) {
  if (valor === null || valor === undefined) return null;
  if (!estaCifrado(valor)) return valor;

  const bruto = Buffer.from(valor.slice(PREFIXO.length), "base64url");
  if (bruto.length < 29) throw new Error("Dado cifrado corrompido.");

  const decifra = createDecipheriv("aes-256-gcm", derivar("cifra"), bruto.subarray(0, 12));
  decifra.setAAD(Buffer.from(String(contexto)));
  decifra.setAuthTag(bruto.subarray(12, 28));

  return Buffer.concat([decifra.update(bruto.subarray(28)), decifra.final()]).toString("utf8");
}

export function garantirCifrado(valor, contexto) {
  if (!valor) return null;
  return estaCifrado(valor) ? valor : cifrar(valor, contexto);
}

/** HMAC determinístico do e-mail: permite buscar/garantir unicidade sem guardá-lo em texto puro. */
export function indiceCego(email) {
  if (typeof email !== "string" || !email.trim()) return null;
  return createHmac("sha256", derivar("indice")).update(email.trim().toLowerCase()).digest("hex");
}
