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
    const { texto } = req.body;

    try {
        const response = await fetch(
            "https://api-inference.huggingface.co/models/facebook/seamless-streaming",
            {
                headers: { 
                    Authorization: `Bearer ${process.env.HF_TOKEN}`,
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({ 
                    inputs: texto,
                    parameters: { src_lang: "por", tgt_lang: "por" } 
                }),
            }
        );

                                                            
        const audioBuffer = await response.arrayBuffer();
        res.setHeader('Content-Type', 'audio/mpeg');
        return res.send(Buffer.from(audioBuffer));

    } catch (error) {
        return res.status(500).json({ error: "Erro na voz da Meta" });
    }
}
