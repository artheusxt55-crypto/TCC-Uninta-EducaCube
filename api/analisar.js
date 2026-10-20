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
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }

    const { prompt, systemContext } = req.body;

    async function tryGroq(apiKey) {
        if (!apiKey) return null;                                   
        try {
            const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: systemContext || "Você é o Untbot da UNINTA Tianguá." },
                        { role: "user", content: prompt }
                    ]
                })
            });
            return response;
        } catch (e) {
            return null;
        }
    }

                                
    let result = await tryGroq(process.env.GROQ_API_KEY);

                                                                                                 
    if (!result || result.status !== 200) {
        console.log("Sistema: Chave 1 expirada. Rotacionando para GROQ_API_KEY2...");
        result = await tryGroq(process.env.GROQ_API_KEY2);
    }

                          
    if (!result || result.status !== 200) {
        const errorData = result ? await result.json() : { error: "Erro de conexão" };
        return res.status(500).json({ 
            error: "Falha na sinapse neural: chaves expiradas.", 
            details: errorData 
        });
    }

    const data = await result.json();
    return res.status(200).json(data);
}
