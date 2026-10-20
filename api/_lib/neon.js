
import { neon } from "@neondatabase/serverless";



const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "[NEON] A variável DATABASE_URL não está configurada."
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
    console.error(
      "[NEON] Falha na conexão com o banco:",
      error
    );

    throw new Error(
      "Não foi possível conectar ao banco de dados."
    );
  }
}
