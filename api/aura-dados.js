import {
  autenticar,
  configurarCors,
  verificarOrigem,
  responderErro,
  ErroApi,
} from "./_lib/seguranca.js";
import {
  ErroDados,
  listarItens,
  criarItem,
  atualizarItem,
  excluirItem,
  lerConfig,
  salvarConfig,
  extrairTextoPdf,
} from "./_lib/aura-dados.js";

/* /api/aura-dados — biblioteca da AURA (estudos, provas, materiais), configurações e leitura de PDF.
   Uma função só (limite de funções da Vercel). O UID vem SEMPRE do ID Token validado, nunca do corpo.
   POST { acao, ... }:
     listar        { tipo }                       -> { itens }
     criar         { tipo, titulo, conteudo }     -> { item }
     atualizar     { id, titulo, conteudo }       -> { item }
     excluir       { id }
     config_ler                                   -> { config }
     config_salvar { config }                     -> { config }
     extrair_pdf   { base64 }                     -> { texto, cortado } */

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

    if (req.method !== "POST") {
      throw new ErroApi(405, "METHOD_NOT_ALLOWED", "Método não permitido.");
    }

    const { uid } = await autenticar(req);
    const corpo = lerBody(req);

    try {
      switch (corpo.acao) {
        case "listar":
          return res.status(200).json({ sucesso: true, itens: await listarItens(uid, corpo.tipo) });

        case "criar":
          return res.status(200).json({ sucesso: true, item: await criarItem(uid, corpo) });

        case "atualizar":
          return res.status(200).json({ sucesso: true, item: await atualizarItem(uid, corpo.id, corpo) });

        case "excluir":
          await excluirItem(uid, corpo.id);
          return res.status(200).json({ sucesso: true });

        case "config_ler":
          return res.status(200).json({ sucesso: true, config: await lerConfig(uid) });

        case "config_salvar":
          return res.status(200).json({ sucesso: true, config: await salvarConfig(uid, corpo.config) });

        case "extrair_pdf":
          return res.status(200).json({ sucesso: true, ...(await extrairTextoPdf(corpo.base64)) });

        default:
          throw new ErroApi(400, "ACTION_INVALID", "Ação inválida.");
      }
    } catch (erro) {
      if (erro instanceof ErroDados) throw new ErroApi(erro.status, erro.codigo, erro.message);
      throw erro;
    }
  } catch (erro) {
    return responderErro(res, erro);
  }
}
