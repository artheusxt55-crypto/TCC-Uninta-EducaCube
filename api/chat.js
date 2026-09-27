import admin from "firebase-admin";
import { construirContextoRAG } from "./rag/index.js";

/* =========================================================
   FIREBASE ADMIN
   ========================================================= */

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

/* =========================================================
   CONFIGURAÇÃO DOS MODELOS
   ========================================================= */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemini-3.8-flash";

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const GROQ_MODEL =
  process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

/* =========================================================
   UPSTASH REDIS
   ========================================================= */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/* =========================================================
   RATE LIMIT
   ========================================================= */

/*
 * Limite individual por usuário.
 *
 * Cada UID possui seu próprio contador.
 *
 * Exemplo:
 *
 * aluno A → 20 requisições
 * aluno B → 20 requisições
 * aluno C → 20 requisições
 *
 * Um usuário não consome o limite do outro.
 */

const USER_RATE_LIMIT = 20;
const USER_RATE_WINDOW_SECONDS = 300;

/*
 * Limite secundário por IP.
 *
 * Serve apenas como proteção contra abuso.
 *
 * Não é o controle principal da AURA.
 */

const IP_RATE_LIMIT = 300;
const IP_RATE_WINDOW_SECONDS = 300;

/* =========================================================
   REDIS
   ========================================================= */

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

/* =========================================================
   RATE LIMIT POR USUÁRIO
   ========================================================= */

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

  /*
   * A primeira requisição inicia a janela
   * de 5 minutos.
   */

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

/* =========================================================
   RATE LIMIT POR IP
   ========================================================= */

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

/* =========================================================
   MÉTRICAS
   ========================================================= */

async function registrarMetrica(uid, dados = {}) {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return;
  }

  try {
    const key = `aura:metrics:${uid}`;

    /*
     * Total de solicitações
     */

    await redisCommand([
      ["HINCRBY", key, "requests", 1],
    ]);

    /*
     * Gemini
     */

    if (dados.provider === "gemini") {
      await redisCommand([
        ["HINCRBY", key, "gemini_requests", 1],
      ]);
    }

    /*
     * Groq
     */

    if (dados.provider === "groq") {
      await redisCommand([
        ["HINCRBY", key, "groq_requests", 1],
      ]);
    }

    /*
     * Fallback
     */

    if (dados.fallback) {
      await redisCommand([
        ["HINCRBY", key, "fallbacks", 1],
      ]);
    }

    /*
     * Erros
     */

    if (dados.error) {
      await redisCommand([
        ["HINCRBY", key, "errors", 1],
      ]);
    }
  } catch (error) {
    /*
     * Falha nas métricas não pode impedir
     * a resposta da AURA.
     */

    console.error(
      "[AURA] Erro ao registrar métrica:",
      error?.message
    );
  }
}

/* =========================================================
   AUTENTICAÇÃO
   ========================================================= */

async function autenticarUsuario(req) {
  const authorization =
    req.headers.authorization || "";

  /*
   * O frontend deve enviar:
   *
   * Authorization: Bearer TOKEN_FIREBASE
   */

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

  /*
   * Firebase verifica a autenticidade
   * do token e devolve os dados do usuário.
   */

  return await auth.verifyIdToken(token);
}

/* =========================================================
   SANITIZAÇÃO DO PROMPT
   ========================================================= */

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

/* =========================================================
   SANITIZAÇÃO DO CONTEXTO
   ========================================================= */

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

/* =========================================================
   RETRY
   ========================================================= */

function esperar(ms) {
  return new Promise(
    (resolve) =>
      setTimeout(resolve, ms)
  );
}

/* =========================================================
   STATUS QUE PODEM SER TENTADOS NOVAMENTE
   ========================================================= */

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

/* =========================================================
   GEMINI
   ========================================================= */

async function chamarGemini({
  prompt,
  contextoRAG,
}) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY não configurada."
    );
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/` +
    `${encodeURIComponent(GEMINI_MODEL)}` +
    `:generateContent` +
    `?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  /*
   * O chat.js não conhece as instruções
   * pedagógicas da AURA.
   *
   * Tudo isso já foi montado pelo RAG.
   */

  const body = {
    contents: [
      {
        role: "user",

        parts: [
          {
            text: contextoRAG,
          },
        ],
      },
    ],

    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 2048,
    },
  };

  let ultimoErro = null;

  /*
   * Duas tentativas antes de acionar o fallback.
   */

  for (
    let tentativa = 1;
    tentativa <= 2;
    tentativa++
  ) {
    try {
      const response = await fetch(
        url,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(body),
        }
      );

      /* ============================================
         SUCESSO
         ============================================ */

      if (response.ok) {
        const data =
          await response.json();

        const texto =
          data
            ?.candidates?.[0]
            ?.content?.parts
            ?.map(
              (part) =>
                part?.text || ""
            )
            .join("")
            .trim();

        if (!texto) {
          throw new Error(
            "Gemini retornou uma resposta vazia."
          );
        }

        return {
          resposta: texto,
          provider: "gemini",
          tentativa,
        };
      }

      /* ============================================
         ERRO
         ============================================ */

      const erroTexto =
        await response.text();

      ultimoErro =
        new Error(
          `Gemini ${response.status}: ${erroTexto}`
        );

      /*
       * Só repete quando o erro pode ser temporário.
       */

      if (
        tentativa < 2 &&
        erroPodeTentarNovamente(
          response.status
        )
      ) {
        await esperar(
          500 * tentativa
        );

        continue;
      }

      throw ultimoErro;
    } catch (error) {
      ultimoErro = error;

      if (tentativa < 2) {
        await esperar(
          500 * tentativa
        );

        continue;
      }
    }
  }

  throw (
    ultimoErro ||
    new Error(
      "Erro desconhecido no Gemini."
    )
  );
}

/* =========================================================
   GROQ — FALLBACK
   ========================================================= */

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

/* =========================================================
   HANDLER PRINCIPAL
   ========================================================= */

export default async function handler(
  req,
  res
) {
  /*
   * Não armazenar resposta da AURA em cache.
   */

  res.setHeader(
    "Cache-Control",
    "no-store"
  );

  /* =======================================================
     MÉTODO HTTP
     ======================================================= */

  if (req.method !== "POST") {
    return res.status(405).json({
      error:
        "Método não permitido.",
    });
  }

  /*
   * UID só será preenchido depois
   * da autenticação.
   */

  let uid = null;

  try {
    /* =====================================================
       1. AUTENTICAÇÃO
       ===================================================== */

    const usuario =
      await autenticarUsuario(req);

    uid = usuario.uid;

    /* =====================================================
       2. RATE LIMIT INDIVIDUAL
       ===================================================== */

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

    /* =====================================================
       3. IDENTIFICAÇÃO DO IP
       ===================================================== */

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

    /* =====================================================
       4. RATE LIMIT SECUNDÁRIO POR IP
       ===================================================== */

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

    /* =====================================================
       5. RECEBER DADOS
       ===================================================== */

    const {
      prompt:
        promptOriginal,

      contexto:
        contextoOriginal = [],
    } = req.body || {};

    /* =====================================================
       6. SANITIZAÇÃO
       ===================================================== */

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

    /* =====================================================
       7. CONSTRUIR RAG
       ===================================================== */

    /*
     * O chat.js não possui o conhecimento da AURA.
     *
     * Ele apenas solicita ao módulo RAG
     * que construa o contexto necessário.
     */

    const contextoRAG =
      await construirContextoRAG({
        pergunta: prompt,

        contexto,

        uid,
      });

    /* =====================================================
       8. GEMINI
       ===================================================== */

    try {
      const resultado =
        await chamarGemini({
          prompt,

          contextoRAG,
        });

      await registrarMetrica(
        uid,
        {
          provider:
            "gemini",
        }
      );

      return res.status(200).json({
        resposta:
          resultado.resposta,

        provider:
          "gemini",

        attempts:
          resultado.tentativa,

        usage: {
          remaining:
            limiteUsuario.remaining,
        },
      });
    } catch (geminiError) {
      console.error(
        "[AURA] Gemini falhou:",
        geminiError?.message
      );

      /* =================================================
         9. FALLBACK GROQ
         ================================================= */

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
    /* =====================================================
       ERROS GERAIS
       ===================================================== */

    console.error(
      "[AURA] Erro:",
      error?.message
    );

    /* =====================================================
       AUTENTICAÇÃO AUSENTE
       ===================================================== */

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

    /* =====================================================
       TOKEN FIREBASE INVÁLIDO/EXPIRADO
       ===================================================== */

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

    /* =====================================================
       MÉTRICA DE ERRO
       ===================================================== */

    if (uid) {
      await registrarMetrica(
        uid,
        {
          error:
            true,
        }
      );
    }

    /* =====================================================
       ERRO INTERNO
       ===================================================== */

    return res.status(500).json({
      error:
        "Não foi possível processar a solicitação.",

      code:
        "AURA_INTERNAL_ERROR",
    });
  }
}
