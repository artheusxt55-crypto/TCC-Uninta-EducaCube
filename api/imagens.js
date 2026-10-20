import { autenticar, configurarCors, verificarOrigem, responderErro } from "./_lib/seguranca.js";

/* Protegido: origem autorizada + usuário logado com e-mail verificado.
   (Antes, qualquer pessoa na internet podia consumir a chave deste serviço.) */
export default async function handler(req, res) {
  configurarCors(req, res);

  try {
    verificarOrigem(req);
    if (req.method === "OPTIONS") return res.status(204).end();
    await autenticar(req);
  } catch (erro) {
    return responderErro(res, erro);
  }

  return executar(req, res);
}

async function executar(req, res) {
    const { prompt } = req.body;
    
                                                         
    const api_key = process.env.POLLINATIONS_API_KEY; 

                                                                  
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux&width=1024&height=1024&nologo=true&seed=${Math.floor(Math.random() * 1000000)}`;

    try {
                                           
        res.status(200).json({ url: imageUrl });
    } catch (error) {
        res.status(500).json({ error: "Erro ao gerar link da imagem" });
    }
}
