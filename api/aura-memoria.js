import {
  autenticar,
  configurarCors,
  verificarOrigem,
  responderErro,
  ErroApi,
} from "./_lib/seguranca.js";
import {
  atualizarMemoria,
  apagarMemoria,
  definirAtiva,
  lerMemoria,
} from "./_lib/aura-memoria.js";

/* /api/aura-memoria — memória da AURA por usuário (Neon, cifrada). Exige e-mail verificado e origem autorizada.
   O UID vem SEMPRE do ID Token validado no servidor, nunca do corpo da requisição.
   GET                         -> { memoria: { perfil, resumo, ativa } }
   POST { acao: "atualizar", pergunta, resposta } -> aprende com a última troca (chamado pelo navegador)
   POST { acao: "ver" | "apagar" | "pausar" | "ativar" } */

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
    const uid = decoded.uid;

    if (req.method === "GET") {
      return res.status(200).json({ sucesso: true, memoria: await lerMemoria(uid) });
    }

    const corpo = lerBody(req);

    switch (corpo.acao) {
      case "atualizar": {
        const resultado = await atualizarMemoria(uid, {
          pergunta: corpo.pergunta,
          resposta: corpo.resposta,
        });
        return res.status(200).json({ sucesso: true, ...resultado });
      }

      case "ver":
        return res.status(200).json({ sucesso: true, memoria: await lerMemoria(uid) });

      case "apagar":
        await apagarMemoria(uid);
        return res.status(200).json({ sucesso: true });

      case "pausar":
        await definirAtiva(uid, false);
        return res.status(200).json({ sucesso: true });

      case "ativar":
        await definirAtiva(uid, true);
        return res.status(200).json({ sucesso: true });

      default:
        throw new ErroApi(400, "ACTION_INVALID", "Ação inválida.");
    }
  } catch (erro) {
    return responderErro(res, erro);
  }
}
