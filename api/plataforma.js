import { ErroApi, configurarCors, exigirPapeis, responderErro, verificarOrigem } from "./_lib/seguranca.js";
import { ROTAS } from "./_lib/plataforma/rotas.js";
import { casar, existeComOutroMetodo } from "./_lib/plataforma/roteador.js";

/* /api/plataforma?rota=<caminho> — UMA função serverless para toda a plataforma
   (a Vercel limita o número de funções por projeto).
     /api/plataforma?rota=turmas
     /api/plataforma?rota=turmas/<id>/atividades
     /api/plataforma?rota=atividades/<id>/entrega
   Ordem de defesa: origem -> token -> e-mail verificado -> papel (consultado no Neon) ->
   papel exigido pela rota -> validação da entrada -> posse do recurso (dentro do SQL). */

function lerCorpo(req) {
  let b = req.body;
  if (typeof b === "string") {
    try {
      b = JSON.parse(b);
    } catch {
      return {};
    }
  }
  return b && typeof b === "object" && !Array.isArray(b) ? b : {};
}

function lerCaminho(req) {
  const r = req.query?.rota;
  return Array.isArray(r) ? r.join("/") : typeof r === "string" ? r : "";
}

export default async function handler(req, res) {
  configurarCors(req, res);

  try {
    verificarOrigem(req);

    if (req.method === "OPTIONS") return res.status(204).end();

    const { decoded, usuario } = await exigirPapeis(req, ["aluno", "professor"]);

    const caminho = lerCaminho(req);
    const achada = casar(ROTAS, req.method, caminho);

    if (!achada) {
      if (existeComOutroMetodo(ROTAS, req.method, caminho)) {
        throw new ErroApi(405, "METHOD_NOT_ALLOWED", "Método não permitido.");
      }
      throw new ErroApi(404, "NOT_FOUND", "Rota não encontrada.");
    }

    if (!achada.rota.papeis.includes(usuario.role)) {
      throw new ErroApi(403, "FORBIDDEN_ROLE", "Você não tem permissão para esta área.");
    }

    const resultado = await achada.rota.handler({
      uid: decoded.uid,
      papel: usuario.role,
      params: achada.params,
      corpo: lerCorpo(req),
      query: req.query || {},
    });

    return res.status(resultado.status || 200).json({ sucesso: true, ...resultado.dados });
  } catch (erro) {
    return responderErro(res, erro);
  }
}
