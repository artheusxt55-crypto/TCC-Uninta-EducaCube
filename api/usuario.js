import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { sql } from "./neon.js";

/* =========================================================
   EDUCACUBE — USUÁRIO / FIREBASE → NEON
   Arquivo: api/usuario.js
   =========================================================
 *
 * Responsabilidades:
 *
 * 1. Receber o Firebase ID Token.
 * 2. Validar o token no Firebase Admin.
 * 3. Obter o UID verdadeiro do Firebase.
 * 4. Procurar o usuário no PostgreSQL/Neon.
 * 5. Criar o usuário no primeiro acesso.
 * 6. Retornar somente os dados necessários da conta.
 *
 * IMPORTANTE:
 *
 * O frontend NÃO informa qual usuário está sendo acessado.
 *
 * O UID utilizado neste arquivo vem exclusivamente do
 * Firebase ID Token validado pelo servidor.
 *
 * ========================================================= */


/* =========================================================
   FIREBASE ADMIN
   ========================================================= */

if (!getApps().length) {
  const chave =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!chave) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY não está configurada na Vercel."
    );
  }

  let serviceAccount;

  try {
    serviceAccount =
      JSON.parse(chave);
  } catch (error) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY possui JSON inválido."
    );
  }

  initializeApp({
    credential:
      cert(serviceAccount),
  });
}

const adminAuth = getAuth();


/* =========================================================
   CORS
   ========================================================= */

function configurarCors(res) {
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

  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    const erro =
      new Error(
        "AUTH_REQUIRED"
      );

    erro.statusCode = 401;

    throw erro;
  }

  const token =
    authorization
      .substring(7)
      .trim();

  if (!token) {
    const erro =
      new Error(
        "AUTH_REQUIRED"
      );

    erro.statusCode = 401;

    throw erro;
  }

  /*
   * O Firebase Admin verifica:
   *
   * - assinatura
   * - validade
   * - projeto
   * - expiração
   * - integridade do token
   */

  return await adminAuth.verifyIdToken(
    token
  );
}


/* =========================================================
   NORMALIZAÇÃO DE DADOS
   ========================================================= */

function limitarTexto(
  valor,
  limite
) {

  if (
    typeof valor !== "string"
  ) {
    return "";
  }

  return valor
    .trim()
    .slice(0, limite);
}



async function obterOuCriarUsuario(
  decodedToken
) {



  const firebaseUid =
    decodedToken.uid;

  if (
    typeof firebaseUid !== "string" ||
    !firebaseUid.trim()
  ) {
    throw new Error(
      "Firebase UID inválido."
    );
  }

  const email =
    limitarTexto(
      decodedToken.email || "",
      320
    );

  const displayName =
    limitarTexto(
      decodedToken.name || "",
      150
    );

  const photoUrl =
    limitarTexto(
      decodedToken.picture || "",
      1000
    );

  const usuarios =
    await sql`
      SELECT
        id,
        firebase_uid,
        email,
        display_name,
        photo_url,
        status,
        created_at,
        updated_at,
        last_login_at
      FROM users
      WHERE firebase_uid = ${firebaseUid}
      LIMIT 1
    `;


  

  if (
    usuarios.length > 0
  ) {

    const usuario =
      usuarios[0];



    if (
      usuario.status !==
      "active"
    ) {
      const erro =
        new Error(
          "ACCOUNT_NOT_ACTIVE"
        );

      erro.statusCode = 403;

      throw erro;
    }


    const atualizados =
      await sql`
        UPDATE users
        SET
          email = ${email || usuario.email},
          display_name =
            ${displayName || usuario.display_name},
          photo_url =
            ${photoUrl || usuario.photo_url},
          last_login_at = NOW(),
          updated_at = NOW()
        WHERE id = ${usuario.id}
        RETURNING
          id,
          firebase_uid,
          email,
          display_name,
          photo_url,
          status,
          created_at,
          updated_at,
          last_login_at
      `;

    return atualizados[0];
  }

  const novosUsuarios =
    await sql`
      INSERT INTO users (
        firebase_uid,
        email,
        display_name,
        photo_url,
        status,
        last_login_at
      )
      VALUES (
        ${firebaseUid},
        ${email},
        ${displayName || null},
        ${photoUrl || null},
        'active',
        NOW()
      )
      RETURNING
        id,
        firebase_uid,
        email,
        display_name,
        photo_url,
        status,
        created_at,
        updated_at,
        last_login_at
    `;

  return novosUsuarios[0];
}


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

  if (
    req.method ===
    "OPTIONS"
  ) {
    return res
      .status(200)
      .end();
  }


  /* =======================================================
     MÉTODO
     ======================================================= */

  if (
    req.method !==
    "GET" &&
    req.method !==
    "POST"
  ) {
    return res.status(405).json({
      sucesso: false,
      erro:
        "Método não permitido.",
    });
  }


  try {

    /* =====================================================
       1. AUTENTICAR
       ===================================================== */

    const decodedToken =
      await autenticarUsuario(
        req
      );


    /* =====================================================
       2. LOCALIZAR / CRIAR
       ===================================================== */

    const usuario =
      await obterOuCriarUsuario(
        decodedToken
      );


    /* =====================================================
       3. RESPOSTA
       ===================================================== */

    return res.status(200).json({

      sucesso: true,

      usuario: {
        id:
          usuario.id,

        firebaseUid:
          usuario.firebase_uid,

        email:
          usuario.email,

        nome:
          usuario.display_name,

        foto:
          usuario.photo_url,

        status:
          usuario.status,

        criadoEm:
          usuario.created_at,

        atualizadoEm:
          usuario.updated_at,

        ultimoLogin:
          usuario.last_login_at,
      },
    });

  } catch (erro) {

    console.error(
      "[USUARIO] Erro:",
      erro?.message ||
        erro
    );


    /* =====================================================
       AUTENTICAÇÃO
       ===================================================== */

    if (
      erro?.message ===
      "AUTH_REQUIRED"
    ) {

      return res.status(401).json({
        sucesso: false,
        erro:
          "Autenticação necessária.",
        codigo:
          "AUTH_REQUIRED",
      });
    }


    /* =====================================================
       TOKEN INVÁLIDO
       ===================================================== */

    if (
      erro?.code ===
        "auth/id-token-expired" ||

      erro?.code ===
        "auth/argument-error" ||

      erro?.code ===
        "auth/id-token-revoked" ||

      erro?.code ===
        "auth/invalid-id-token"
    ) {

      return res.status(401).json({
        sucesso: false,
        erro:
          "Token Firebase inválido ou expirado.",
        codigo:
          "AUTH_INVALID",
      });
    }


    /* =====================================================
       CONTA BLOQUEADA
       ===================================================== */

    if (
      erro?.message ===
      "ACCOUNT_NOT_ACTIVE"
    ) {

      return res.status(403).json({
        sucesso: false,
        erro:
          "Esta conta não está ativa.",
        codigo:
          "ACCOUNT_NOT_ACTIVE",
      });
    }


    /* =====================================================
       ERRO INTERNO
       ===================================================== */

    return res.status(500).json({
      sucesso: false,
      erro:
        "Não foi possível carregar a conta.",
      codigo:
        "USER_SERVICE_ERROR",
    });
  }
}
