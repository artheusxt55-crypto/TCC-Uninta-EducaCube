import fetch from "node-fetch";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

/* =========================================================
   FIREBASE ADMIN
   ========================================================= */

function getFirebaseAuth() {
  if (getApps().length > 0) {
    return getAuth();
  }

  const serviceAccountKey =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY não está configurada."
    );
  }

  const serviceAccount =
    JSON.parse(serviceAccountKey);

  initializeApp({
    credential: cert(serviceAccount),
  });

  return getAuth();
}

/* =========================================================
   UPSTASH REDIS
   ========================================================= */

const UPSTASH_URL =
  process.env.UPSTASH_REDIS_REST_URL;

const UPSTASH_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN;

/* =========================================================
   CORS
   ========================================================= */

function configurarCors(res) {
  /*
   * Em produção, o ideal é trocar "*" pelo domínio
   * oficial da aplicação.
   *
   * Por enquanto mantemos compatibilidade com a aplicação.
   */

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );
}

/* =========================================================
   AUTENTICAÇÃO
   ========================================================= */

async function autenticarUsuario(req) {
  const authorization =
    req.headers.authorization || "";

  if (!authorization.startsWith("Bearer ")) {
    const erro = new Error("AUTH_REQUIRED");
    erro.statusCode = 401;
    throw erro;
  }

  const token =
    authorization
      .substring(7)
      .trim();

  if (!token) {
    const erro = new Error("AUTH_REQUIRED");
    erro.statusCode = 401;
    throw erro;
  }

  const auth = getFirebaseAuth();

  /*
   * O Firebase determina o UID real.
   *
   * NUNCA usamos userId enviado pelo frontend.
   */

  const decodedToken =
    await auth.verifyIdToken(token);

  if (!decodedToken?.uid) {
    const erro =
      new Error("USUARIO_INVALIDO");

    erro.statusCode = 401;

    throw erro;
  }

  return decodedToken;
}

/* =========================================================
   NORMALIZAÇÃO DO USER ID
   ========================================================= */

function normalizarUid(uid) {
  /*
   * O UID veio diretamente do Firebase.
   *
   * Ainda assim, fazemos uma validação básica
   * antes de utilizá-lo como parte da chave Redis.
   */

  if (
    typeof uid !== "string" ||
    !uid.trim()
  ) {
    const erro =
      new Error("UID_INVALIDO");

    erro.statusCode = 401;

    throw erro;
  }

  const resultado = uid.trim();

  /*
   * Firebase UIDs normalmente são strings simples.
   * Esta validação impede caracteres que poderiam
   * alterar a estrutura da URL do Redis.
   */

  if (
    !/^[A-Za-z0-9_-]+$/.test(resultado)
  ) {
    const erro =
      new Error("UID_INVALIDO");

    erro.statusCode = 401;

    throw erro;
  }

  return resultado;
}

/* =========================================================
   AÇÕES PERMITIDAS
   ========================================================= */

const ACOES_PERMITIDAS = new Set([
  "rpush",
  "lrange",
  "ltrim",
]);

/* =========================================================
   HANDLER
   ========================================================= */

export default async function handler(
  req,
  res
) {
  configurarCors(res);

  /* =======================================================
     OPTIONS
     ======================================================= */

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  /* =======================================================
     MÉTODO
     ======================================================= */

  if (
    req.method !== "POST" &&
    req.method !== "GET"
  ) {
    return res.status(405).json({
      error: "Método não permitido",
    });
  }

  try {
    /* =====================================================
       REDIS CONFIG
       ===================================================== */

    if (
      !UPSTASH_URL ||
      !UPSTASH_TOKEN
    ) {
      console.error(
        "[MEMORIA] Variáveis do Redis não configuradas."
      );

      return res.status(500).json({
        error:
          "Serviço de memória não configurado.",
      });
    }

    /* =====================================================
       AUTENTICAÇÃO
       ===================================================== */

    const decodedToken =
      await autenticarUsuario(req);

    /*
     * ESTE é o único identificador usado
     * para acessar a memória.
     */

    const uid =
      normalizarUid(
        decodedToken.uid
      );

    /* =====================================================
       BODY
       ===================================================== */

    const body =
      req.body || {};

    const {
      texto,
      autor,
      acao,
    } = body;

    /* =====================================================
       VALIDAÇÃO DA AÇÃO
       ===================================================== */

    if (
      typeof acao !== "string" ||
      !ACOES_PERMITIDAS.has(acao)
    ) {
      return res.status(400).json({
        error:
          "Ação de memória não permitida.",
      });
    }

    /* =====================================================
       CHAVE DO USUÁRIO
       ===================================================== */

    /*
     * IMPORTANTE:
     *
     * Antes:
     *
     * req.body.userId
     *
     * Agora:
     *
     * decodedToken.uid
     *
     * Portanto o cliente NÃO consegue escolher
     * a memória de outro usuário.
     */

    const redisKey =
      `aura:memoria:${uid}`;

    /* =====================================================
       URL REDIS
       ===================================================== */

    let finalUrl =
      `${UPSTASH_URL}/${acao}/${encodeURIComponent(redisKey)}`;

    let method = "POST";

    /* =====================================================
       RPUSH
       ===================================================== */

    if (acao === "rpush") {
      if (
        typeof texto !== "string" ||
        !texto.trim()
      ) {
        return res.status(400).json({
          error:
            "texto é obrigatório para rpush.",
        });
      }

      if (
        typeof autor !== "string" ||
        !autor.trim()
      ) {
        return res.status(400).json({
          error:
            "autor é obrigatório para rpush.",
        });
      }

      /*
       * Limites defensivos.
       */

      const textoSeguro =
        texto
          .trim()
          .slice(0, 12000);

      const autorSeguro =
        autor
          .trim()
          .slice(0, 100);

      const mensagem =
        `${autorSeguro}: ${textoSeguro}`;

      finalUrl +=
        `/${encodeURIComponent(mensagem)}`;

      method = "POST";
    }

    /* =====================================================
       LRANGE
       ===================================================== */

    else if (acao === "lrange") {
      /*
       * Retorna todo o histórico armazenado
       * PARA O USUÁRIO AUTENTICADO.
       */

      finalUrl +=
        "/0/-1";

      method = "GET";
    }

  
    else if (acao === "ltrim") {
   
   

      finalUrl +=
        "/-10/-1";

      method = "POST";
    }

   
    const resp =
      await fetch(
        finalUrl,
        {
          method,

          headers: {
            Authorization:
              `Bearer ${UPSTASH_TOKEN}`,
          },
        }
      );

    if (!resp.ok) {
      const textoErro =
        await resp.text();

      console.error(
        "[MEMORIA] Erro Redis:",
        resp.status,
        textoErro
      );

      return res.status(502).json({
        error:
          "Falha ao acessar a memória.",
      });
    }

 
    const data =
      await resp.json();

    return res.status(200).json({
      success: true,
      data,
    });

  } catch (error) {
   
    if (
      error?.message ===
        "AUTH_REQUIRED"
    ) {
      return res.status(401).json({
        error:
          "Autenticação necessária.",
      });
    }

    if (
      error?.code ===
        "auth/id-token-expired"
    ) {
      return res.status(401).json({
        error:
          "Token expirado. Faça login novamente.",
      });
    }

    if (
      error?.code ===
        "auth/argument-error" ||
      error?.code ===
        "auth/invalid-id-token"
    ) {
      return res.status(401).json({
        error:
          "Token de autenticação inválido.",
      });
    }

    if (
      error?.message ===
        "UID_INVALIDO"
    ) {
      return res.status(401).json({
        error:
          "Usuário autenticado inválido.",
      });
    }

    /* =====================================================
       ERRO GERAL
       ===================================================== */

    console.error(
      "[MEMORIA] Erro:",
      error
    );

    return res.status(500).json({
      error:
        "Falha no backend.",
    });
  }
}
