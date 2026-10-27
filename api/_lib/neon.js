import { neon } from "@neondatabase/serverless";

function extrairUrl(bruto) {
  const texto = String(bruto ?? "").trim();
  const achada = texto.match(/postgres(?:ql)?:\/\/[^\s'"]+/i);
  return achada ? achada[0] : "";
}

function validarUrl(url) {
  if (!url) {
    return "não começa com postgresql:// (ou postgres://)";
  }
  let u;
  try {
    u = new URL(url);
  } catch {
    return "não é uma URL válida (confira caracteres especiais na senha: @ # / : ? devem ser codificados)";
  }
  const faltando = [];
  if (!u.username) faltando.push("usuário");
  if (!u.password) faltando.push("senha");
  if (!u.hostname) faltando.push("host");
  if (!u.pathname || u.pathname === "/") faltando.push("nome do banco");
  return faltando.length ? `faltando: ${faltando.join(", ")}` : null;
}

const bruta = process.env.DATABASE_URL;

if (!bruta || !bruta.trim()) {
  throw new Error("[NEON] A variável DATABASE_URL não está configurada.");
}

const databaseUrl = extrairUrl(bruta);
const problema = validarUrl(databaseUrl);

if (problema) {
  throw new Error(
    `[NEON] DATABASE_URL inválida: ${problema}. ` +
      "Formato esperado: postgresql://usuario:senha@host/banco?sslmode=require",
  );
}

export const sql = neon(databaseUrl);

export async function verificarConexaoNeon() {
  try {
    const resultado = await sql`
      SELECT NOW() AS horario,
             current_database() AS banco
    `;

    return {
      conectado: true,
      horario: resultado[0].horario,
      banco: resultado[0].banco,
    };
  } catch (error) {
    console.error("[NEON] Falha na conexão com o banco:", error);

    throw new Error("Não foi possível conectar ao banco de dados.");
  }
}
