import admin from "firebase-admin";
import { construirContextoRAG } from "./_lib/rag/index.js";

                                                            
                 
                                                               

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const auth = admin.auth();

                                                            
                           
                                                               

const AURA_IA_KEY = process.env.AURA_IA;

const AURA_IA_MODEL =
  process.env.AURA_IA_MODEL || "nvidia/nemotron-3.5-bolt-e4b";

const AURA_IA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

const AURA_IA_TIMEOUT_MS = 20000;

const GROQ_API_KEY =
  process.env.GROQ_API_KEY || process.env.GROQ_API_KEY2;

const GROQ_MODEL =
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

                                                            
                
                                                               

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

                                                            
             
                                                               

  
                                 
  
                                        
  
           
  
                           
                           
                           
  
                                            
   

const USER_RATE_LIMIT = 20;
const USER_RATE_WINDOW_SECONDS = 300;

  
                            
  
                                           
  
                                      
   

const IP_RATE_LIMIT = 300;
const IP_RATE_WINDOW_SECONDS = 300;

                                                            
        
                                                               

async function redisCommand(command) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return null;
  }

  try {
    const response = await fetch(UPSTASH_URL, {
      method: "POST",

      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },

      body: JSON.stringify(command),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(
      "[AURA] Erro no Redis:",
      error?.message
    );

    return null;
  }
}

                                                            
                         
                                                               

async function checkUserRateLimit(uid) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return {
      allowed: true,
      remaining: USER_RATE_LIMIT,
    };
  }

  const key = `aura:ratelimit:user:${uid}`;

  const result = await redisCommand([
    ["INCR", key],
  ]);

  const count = Number(result?.result ?? 0);

    
                                          
                  
     

  if (count === 1) {
    await redisCommand([
      ["EXPIRE", key, USER_RATE_WINDOW_SECONDS],
    ]);
  }

  return {
    allowed: count <= USER_RATE_LIMIT,

    remaining: Math.max(
      USER_RATE_LIMIT - count,
      0
    ),
  };
}

                                                            
                    
                                                               

async function checkIpRateLimit(ip) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return {
      allowed: true,
      remaining: IP_RATE_LIMIT,
    };
  }

  const key = `aura:ratelimit:ip:${ip}`;

  const result = await redisCommand([
    ["INCR", key],
  ]);

  const count = Number(result?.result ?? 0);

  if (count === 1) {
    await redisCommand([
      ["EXPIRE", key, IP_RATE_WINDOW_SECONDS],
    ]);
  }

  return {
    allowed: count <= IP_RATE_LIMIT,

    remaining: Math.max(
      IP_RATE_LIMIT - count,
      0
    ),
  };
}

                                                            
           
                                                               

async function registrarMetrica(uid, dados = {}) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return;
  }

  try {
    const key = `aura:metrics:${uid}`;

      
                            
       

    await redisCommand([
      ["HINCRBY", key, "requests", 1],
    ]);

      
             
       

    if (dados.provider === "nemotron") {
      await redisCommand([
        ["HINCRBY", key, "nemotron_requests", 1],
      ]);
    }

      
           
       

    if (dados.provider === "groq") {
      await redisCommand([
        ["HINCRBY", key, "groq_requests", 1],
      ]);
    }

      
               
       

    if (dados.fallback) {
      await redisCommand([
        ["HINCRBY", key, "fallbacks", 1],
      ]);
    }

      
            
       

    if (dados.error) {
      await redisCommand([
        ["HINCRBY", key, "errors", 1],
      ]);
    }
  } catch (error) {
      
                                          
                          
       

    console.error(
      "[AURA] Erro ao registrar métrica:",
      error?.message
    );
  }
}

                                                            
               
                                                               

async function autenticarUsuario(req) {
  const authorization =
    req.headers.authorization || "";

    
                            
    
                                         
     

  if (!authorization.startsWith("Bearer ")) {
    throw new Error("AUTH_REQUIRED");
  }

  const token =
    authorization
      .slice(7)
      .trim();

  if (!token) {
    throw new Error("AUTH_REQUIRED");
  }

    
                                      
                                            
     

  const decoded = await auth.verifyIdToken(token);

  if (decoded.email_verified !== true) {
    throw new Error("EMAIL_NOT_VERIFIED");
  }

  return decoded;
}

                                                            
                        
                                                               

function sanitizarTexto(
  texto,
  limite = 12000
) {
  if (typeof texto !== "string") {
    return "";
  }

  return texto
    .trim()
    .slice(0, limite);
}

                                                            
                          
                                                               

function sanitizarContexto(contexto) {
  if (!Array.isArray(contexto)) {
    return [];
  }

  return contexto
    .filter(
      (item) =>
        typeof item === "string"
    )
    .map(
      (item) =>
        item.trim()
    )
    .filter(Boolean)
    .slice(-12)
    .map(
      (item) =>
        item.slice(0, 4000)
    );
}

                                                            
        
                                                               

function esperar(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(resolve, ms)
  );
}

                                                            
                                          
                                                               

function erroPodeTentarNovamente(
  status
) {
  return (
    status === 408 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

                                                            
         
                                                               

function limparRaciocinio(texto) {
  if (typeof texto !== "string") {
    return "";
  }

  return texto
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*$/i, "")
    .trim();
}

async function chamarNemotron({
  prompt,
  contextoRAG,
}) {
  if (!AURA_IA_KEY) {
    throw new Error(
      "AURA_IA não configurada."
    );
  }

  const body = {
    model: AURA_IA_MODEL,

    messages: [
      {
        role: "user",
        content: contextoRAG,
      },
    ],

    temperature: 0.4,
    max_tokens: 2048,
    stream: false,
  };

  let ultimoErro = null;

  for (
    let tentativa = 1;
    tentativa <= 2;
    tentativa++
  ) {
    try {
      const response = await fetch(
        AURA_IA_URL,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Accept:
              "application/json",

            Authorization:
              `Bearer ${AURA_IA_KEY}`,
          },

          body: JSON.stringify(body),

          signal: AbortSignal.timeout(
            AURA_IA_TIMEOUT_MS
          ),
        }
      );

      if (response.ok) {
        const data =
          await response.json();

        const texto =
          limparRaciocinio(
            data
              ?.choices?.[0]
              ?.message
              ?.content
          );

        if (!texto) {
          throw new Error(
            "Nemotron retornou uma resposta vazia."
          );
        }

        return {
          resposta: texto,
          provider: "nemotron",
          tentativa,
        };
      }

      const erroTexto =
        await response.text();

      const erro = new Error(
        `Nemotron ${response.status}: ${erroTexto.slice(0, 500)}`
      );

      erro.status = response.status;

      throw erro;
    } catch (error) {
      ultimoErro = error;

      // Chave inválida (401), modelo inexistente (404) e timeout não melhoram repetindo.
      const definitivo =
        error?.name === "TimeoutError" ||
        (error?.status &&
          !erroPodeTentarNovamente(
            error.status
          ));

      if (definitivo || tentativa >= 2) {
        break;
      }

      await esperar(500 * tentativa);
    }
  }

  throw (
    ultimoErro ||
    new Error(
      "Erro desconhecido no Nemotron."
    )
  );
}

                                                            
                  
                                                               

async function chamarGroq({
  prompt,
  contextoRAG,
}) {
  if (!GROQ_API_KEY) {
    throw new Error(
      "GROQ_API_KEY não configurada."
    );
  }

  const response =
    await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${GROQ_API_KEY}`,
        },

        body: JSON.stringify({
          model: GROQ_MODEL,

          messages: [
            {
              role: "user",

              content:
                contextoRAG,
            },
          ],

          temperature: 0.4,

          max_tokens: 2048,
        }),
      }
    );

  if (!response.ok) {
    const erroTexto =
      await response.text();

    throw new Error(
      `Groq ${response.status}: ${erroTexto}`
    );
  }

  const data =
    await response.json();

  const texto =
    data
      ?.choices?.[0]
      ?.message
      ?.content
      ?.trim();

  if (!texto) {
    throw new Error(
      "Groq retornou uma resposta vazia."
    );
  }

  return {
    resposta: texto,
    provider: "groq",
    tentativa: 1,
  };
}

                                                            
                    
                                                               

export default async function handler(
  req,
  res
) {
    
                                             
     

  res.setHeader(
    "Cache-Control",
    "no-store"
  );

                                                            
                
                                                               

  if (req.method !== "POST") {
    return res.status(405).json({
      error:
        "Método não permitido.",
    });
  }

    
                                  
                     
     

  let uid = null;

  try {
                                                            
                      
                                                               

    const usuario =
      await autenticarUsuario(req);

    uid = usuario.uid;

                                                            
                               
                                                               

    const limiteUsuario =
      await checkUserRateLimit(uid);

    if (!limiteUsuario.allowed) {
      return res.status(429).json({
        error:
          "Você atingiu o limite temporário de uso da AURA. Tente novamente em alguns minutos.",

        code:
          "USER_RATE_LIMIT",

        remaining: 0,
      });
    }

                                                            
                             
                                                               

    const forwardedFor =
      req.headers[
        "x-forwarded-for"
      ];

    const ip =
      typeof forwardedFor ===
      "string"
        ? forwardedFor
            .split(",")[0]
            .trim()
        : req.socket
            ?.remoteAddress ||
          "unknown";

                                                            
                                      
                                                               

    const limiteIp =
      await checkIpRateLimit(ip);

    if (!limiteIp.allowed) {
      return res.status(429).json({
        error:
          "Muitas solicitações foram realizadas a partir desta rede. Tente novamente em alguns minutos.",

        code:
          "IP_RATE_LIMIT",
      });
    }

                                                            
                       
                                                               

    const {
      prompt:
        promptOriginal,

      contexto:
        contextoOriginal = [],
    } = req.body || {};

                                                            
                     
                                                               

    const prompt =
      sanitizarTexto(
        promptOriginal
      );

    const contexto =
      sanitizarContexto(
        contextoOriginal
      );

    if (!prompt) {
      return res.status(400).json({
        error:
          "A pergunta não pode estar vazia.",
      });
    }

                                                            
                       
                                                               

      
                                                   
      
                                        
                                          
       

    const contextoRAG =
      await construirContextoRAG({
        pergunta: prompt,

        contexto,

        uid,
      });

                                                            
                
                                                               

    try {
      const resultado =
        await chamarNemotron({
          prompt,

          contextoRAG,
        });

      await registrarMetrica(
        uid,
        {
          provider:
            "nemotron",
        }
      );

      return res.status(200).json({
        resposta:
          resultado.resposta,

        provider:
          "nemotron",

        attempts:
          resultado.tentativa,

        usage: {
          remaining:
            limiteUsuario.remaining,
        },
      });
    } catch (nemotronError) {
      console.error(
        "[AURA] Nemotron falhou:",
        nemotronError?.message
      );

                                                          
                         
                                                             

      try {
        const resultado =
          await chamarGroq({
            prompt,

            contextoRAG,
          });

        await registrarMetrica(
          uid,
          {
            provider:
              "groq",

            fallback:
              true,
          }
        );

        return res.status(200).json({
          resposta:
            resultado.resposta,

          provider:
            "groq",

          fallback:
            true,

          attempts:
            resultado.tentativa,

          usage: {
            remaining:
              limiteUsuario.remaining,
          },
        });
      } catch (groqError) {
        console.error(
          "[AURA] Groq também falhou:",
          groqError?.message
        );

        await registrarMetrica(
          uid,
          {
            error:
              true,
          }
        );

        return res.status(503).json({
          error:
            "A AURA está temporariamente indisponível. Tente novamente em instantes.",

          code:
            "AI_UNAVAILABLE",
        });
      }
    }
  } catch (error) {
                                                            
                   
                                                               

    console.error(
      "[AURA] Erro:",
      error?.message
    );

                                                            
                           
                                                               

    if (error?.message === "EMAIL_NOT_VERIFIED") {
      return res.status(403).json({
        error: "Confirme seu e-mail para utilizar a AURA.",
        code: "EMAIL_NOT_VERIFIED",
      });
    }

    if (
      error?.message ===
      "AUTH_REQUIRED"
    ) {
      return res.status(401).json({
        error:
          "É necessário estar autenticado para utilizar a AURA.",

        code:
          "AUTH_REQUIRED",
      });
    }

                                                            
                                       
                                                               

    if (
      error?.code ===
        "auth/id-token-expired" ||

      error?.code ===
        "auth/argument-error" ||

      error?.code ===
        "auth/id-token-revoked"
    ) {
      return res.status(401).json({
        error:
          "Sua sessão expirou. Faça login novamente.",

        code:
          "AUTH_INVALID",
      });
    }

                                                            
                      
                                                               

    if (uid) {
      await registrarMetrica(
        uid,
        {
          error:
            true,
        }
      );
    }

                                                            
                   
                                                               

    return res.status(500).json({
      error:
        "Não foi possível processar a solicitação.",

      code:
        "AURA_INTERNAL_ERROR",
    });
  }
}
