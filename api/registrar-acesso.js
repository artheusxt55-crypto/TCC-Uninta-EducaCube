
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

if (!getApps().length) {
  const chave = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!chave) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_KEY não está configurada na Vercel."
    );
  }

  const serviceAccount = JSON.parse(chave);

  initializeApp({
    credential: cert(serviceAccount),
  });
}

const adminAuth = getAuth();
const db = getFirestore();

function pegarIP(req) {
  const forwarded = req.headers["x-forwarded-for"];

  if (forwarded) {
    const ip = forwarded.split(",")[0].trim();

    if (ip) {
      return ip;
    }
  }

  return (
    req.headers["x-real-ip"] ||
    req.socket?.remoteAddress ||
    null
  );
}

function normalizarIP(ip) {
  if (!ip) return null;

  let resultado = String(ip).trim();

  if (resultado.startsWith("::ffff:")) {
    resultado = resultado.replace("::ffff:", "");
  }

  return resultado;
}

async function localizarIP(ip) {
  const resultado = {
    pais: "",
    estado: "",
    cidade: "",
    latitude: null,
    longitude: null,
  };

  if (!ip) {
    return resultado;
  }

  try {
    const resposta = await fetch(
      `https://ipwho.is/${encodeURIComponent(ip)}`
    );

    if (!resposta.ok) {
      console.error(
        "ipwho.is retornou status:",
        resposta.status
      );

      return resultado;
    }

    const geo = await resposta.json();

    if (!geo || geo.success !== true) {
      console.error(
        "IP não localizado:",
        geo
      );

      return resultado;
    }

    resultado.pais = geo.country || "";
    resultado.estado = geo.region || "";
    resultado.cidade = geo.city || "";

    if (typeof geo.latitude === "number") {
      resultado.latitude = geo.latitude;
    }

    if (typeof geo.longitude === "number") {
      resultado.longitude = geo.longitude;
    }

    console.log(
      "Geolocalização:",
      resultado
    );

    return resultado;

  } catch (erro) {
    console.error(
      "Erro na geolocalização:",
      erro
    );

    return resultado;
  }
}

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      sucesso: false,
      erro: "Método não permitido",
    });
  }

  try {

    const authorization =
      req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        sucesso: false,
        erro: "Token Bearer não informado",
      });
    }

    const token =
      authorization.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        sucesso: false,
        erro: "Token vazio",
      });
    }

    const decodedToken =
      await adminAuth.verifyIdToken(token);

    if (decodedToken.email_verified !== true) {
      return res.status(403).json({
        sucesso: false,
        erro: "Confirme seu e-mail para continuar.",
        codigo: "EMAIL_NOT_VERIFIED",
      });
    }

    const uid = decodedToken.uid;

    console.log(
      "Usuário autenticado:",
      uid
    );

    const nome =
      decodedToken.name || "";

    const email =
      decodedToken.email || "";

    const foto =
      decodedToken.picture || "";

    const ip =
      normalizarIP(pegarIP(req));

    console.log(
      "IP detectado:",
      ip
    );

    const geo =
      await localizarIP(ip);

    const usuarioRef = db
      .collection("usuarios")
      .doc(uid);

    await usuarioRef.set(
      {
        uid,
        nome,
        email,
        foto,

        ultimoAcesso:
          FieldValue.serverTimestamp(),

        ultimoIP: ip,

        ultimoPais:
          geo.pais,

        ultimoEstado:
          geo.estado,

        ultimaCidade:
          geo.cidade,

        ultimaLatitude:
          geo.latitude,

        ultimaLongitude:
          geo.longitude,

        atualizadoEm:
          FieldValue.serverTimestamp(),
      },
      {
        merge: true,
      }
    );

    console.log(
      "Perfil atualizado no Firestore."
    );

    const acessoRef =
      await usuarioRef
        .collection("acessos")
        .add({
          data:
            FieldValue.serverTimestamp(),

          ip,

          pais:
            geo.pais,

          estado:
            geo.estado,

          cidade:
            geo.cidade,

          latitude:
            geo.latitude,

          longitude:
            geo.longitude,

          userAgent:
            req.headers["user-agent"] || "",

          uid,
        });

    console.log(
      "Acesso registrado:",
      acessoRef.id
    );

    return res.status(200).json({
      sucesso: true,

      uid,

      ip,

      pais: geo.pais,

      estado: geo.estado,

      cidade: geo.cidade,

      latitude: geo.latitude,

      longitude: geo.longitude,

      acessoId: acessoRef.id,

      mensagem:
        "Acesso registrado com sucesso",
    });

  } catch (erro) {

    console.error(
      "Erro ao registrar acesso:",
      erro
    );

    return res.status(500).json({
      sucesso: false,

      erro:
        erro?.message ||
        "Não foi possível registrar o acesso",
    });
  }
}
