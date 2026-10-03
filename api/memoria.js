import fetch from "node-fetch";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

                                                            
                 
                                                               

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

                                                            
                
                                                               

const UPSTASH_URL =
  process.env.UPSTASH_REDIS_REST_URL;

const UPSTASH_TOKEN =
  process.env.UPSTASH_REDIS_REST_TOKEN;

                                                            
       
                                                               

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

                                                            
                          
                                                               

function normalizarUid(uid) {
    
                                        
    
                                              
                                                   
     

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

                                                            
                   
                                                               

const ACOES_PERMITIDAS = new Set([
  "rpush",
  "lrange",
  "ltrim",
]);

                                                            
          
                                                               

export default async function handler(
  req,
  res
) {
  configurarCors(res);

                                                            
            
                                                               

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

                                                            
           
                                                               

  if (
    req.method !== "POST" &&
    req.method !== "GET"
  ) {
    return res.status(405).json({
      error: "Método não permitido",
    });
  }

  try {
                                                            
                   
                                                               

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

                                                            
                   
                                                               

    const decodedToken =
      await autenticarUsuario(req);

      
                                         
                              
       

    const uid =
      normalizarUid(
        decodedToken.uid
      );

                                                            
           
                                                               

    const body =
      req.body || {};

    const {
      texto,
      autor,
      acao,
    } = body;

                                                            
                        
                                                               

    if (
      typeof acao !== "string" ||
      !ACOES_PERMITIDAS.has(acao)
    ) {
      return res.status(400).json({
        error:
          "Ação de memória não permitida.",
      });
    }

                                                            
                       
                                                               

      
                  
      
             
      
                      
      
             
      
                       
      
                                               
                                  
       

    const redisKey =
      `aura:memoria:${uid}`;

                                                            
                
                                                               

    let finalUrl =
      `${UPSTASH_URL}/${acao}/${encodeURIComponent(redisKey)}`;

    let method = "POST";

                                                            
            
                                                               

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

                                                            
             
                                                               

    else if (acao === "lrange") {
        
                                            
                                    
         

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
