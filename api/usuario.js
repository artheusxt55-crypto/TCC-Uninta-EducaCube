import {
  autenticar,
  obterOuCriarUsuario,
  aplicarPapel,
  configurarCors,
  verificarOrigem,
  responderErro,
  ErroApi,
} from "./_lib/seguranca.js";
import { normalizarPapel } from "./_lib/papel.js";

/* /api/usuario (Firebase -> Neon). Exige e-mail verificado e origem autorizada.
   GET  -> conta e papel atual (papel pode ser null).
   POST -> { papel: "aluno" | "professor" }: define o papel UMA vez; se a conta já tiver outro
           papel responde 403 ROLE_MISMATCH e NADA é alterado.
   O UID vem exclusivamente do ID Token validado no servidor. */

function lerBody(req) {
  const b = req.body;
  if (!b) return {};
  if (typeof b === "string") {
    try {
      return JSON.parse(b);
    } catch {
      return {};
    }
  }
  return typeof b === "object" ? b : {};
}

export default async function handler(req, res) {
  configurarCors(req, res);

  try {
    verificarOrigem(req);

    if (req.method === "OPTIONS") return res.status(204).end();

    if (req.method !== "GET" && req.method !== "POST") {
      throw new ErroApi(405, "METHOD_NOT_ALLOWED", "Método não permitido.");
    }

    const decoded = await autenticar(req);
    let usuario = await obterOuCriarUsuario(decoded);

    let papel = normalizarPapel(usuario.role);

    if (req.method === "POST") {
      const pedido = lerBody(req).papel;

      if (pedido !== undefined && !normalizarPapel(pedido)) {
        throw new ErroApi(400, "ROLE_INVALID", "Papel inválido.");
      }

      papel = await aplicarPapel(usuario, decoded, pedido);
      usuario = { ...usuario, role: papel };
    } else if (papel && decoded.role !== papel) {
      // Conta antiga com papel no Neon mas sem o claim no Firebase ainda.
      papel = await aplicarPapel(usuario, decoded, undefined);
    }

    return res.status(200).json({
      sucesso: true,
      papel,
      usuario: {
        id: usuario.id,
        firebaseUid: usuario.firebase_uid,
        email: usuario.email,
        nome: usuario.display_name,
        foto: usuario.photo_url,
        status: usuario.status,
        papel,
        criadoEm: usuario.created_at,
        atualizadoEm: usuario.updated_at,
        ultimoLogin: usuario.last_login_at,
      },
    });
  } catch (erro) {
    return responderErro(res, erro);
  }
}
