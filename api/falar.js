               
export default async function handler(req, res) {
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
