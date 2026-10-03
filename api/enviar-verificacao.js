import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

function getFirebaseAdmin() {
  if (getApps().length > 0) {
    return getAuth();
  }

  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  );

  initializeApp({
    credential: cert(serviceAccount),
  });

  return getAuth();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Método não permitido",
    });
  }

  try {
    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "Token Bearer não informado",
      });
    }

    const token = authorization.substring(7).trim();

    if (!token) {
      return res.status(401).json({
        error: "Token vazio",
      });
    }

    const adminAuth = getFirebaseAdmin();

                                                              
                                                              
                                                                      
    const decodedToken = await adminAuth.verifyIdToken(token);
    const email = decodedToken.email;

    if (!email) {
      return res.status(400).json({
        error: "Esta conta não possui e-mail associado.",
      });
    }

    if (decodedToken.email_verified) {
      return res.status(200).json({
        success: true,
        message: "E-mail já verificado.",
      });
    }

                                               
    const verificationLink =
      await adminAuth.generateEmailVerificationLink(email);

    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },

        body: JSON.stringify({
          from: "EducaCube <noreply@educacube.online>",
          to: [email],
          subject: "Confirme seu e-mail • EducaCube",

          html: `
<!DOCTYPE html>
<html lang="pt-BR">

<head>
  <meta charset="UTF-8">

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  >

  <title>Confirme seu e-mail - EducaCube</title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background-color:#f5f3ff;
    font-family:Arial, Helvetica, sans-serif;
    color:#18181b;
  "
>

  <!-- FUNDO -->
  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
      background-color:#f5f3ff;
      padding:40px 15px;
    "
  >

    <tr>

      <td align="center">

        <!-- CARD PRINCIPAL -->
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width:600px;
            background-color:#ffffff;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 10px 40px rgba(76,29,149,0.10);
          "
        >

          <!-- BARRA ROXA -->
          <tr>

            <td
              style="
                height:6px;
                background-color:#7c3aed;
                font-size:0;
                line-height:0;
              "
            >
              &nbsp;
            </td>

          </tr>


          <!-- HEADER -->
          <tr>

            <td
              align="center"
              style="
                padding:38px 35px 28px;
              "
            >

              <!-- LOGO EDUCACUBE -->
              <table
                cellpadding="0"
                cellspacing="0"
                border="0"
                align="center"
                style="
                  margin:0 auto 18px;
                "
              >

                <tr>

                  <td
                    align="center"
                    valign="middle"
                    style="
                      text-align:center;
                    "
                  >

                    <img
                      src="https://github.com/artheusxt55-crypto/TCC-Uninta-Neurociencie/blob/main/public/logo-educacube.png?raw=true"
                      alt="EducaCube"
                      width="82"
                      style="
                        display:block;
                        width:82px;
                        max-width:82px;
                        height:auto;
                        margin:0 auto;
                        border:0;
                        outline:none;
                        text-decoration:none;
                      "
                    >

                  </td>

                </tr>

              </table>


              <!-- NOME -->
              <div
                style="
                  color:#5b21b6;
                  font-size:25px;
                  font-weight:700;
                  letter-spacing:-0.5px;
                "
              >
                EducaCube
              </div>


              <!-- SUBTÍTULO -->
              <div
                style="
                  margin-top:7px;
                  color:#8b5cf6;
                  font-size:11px;
                  font-weight:600;
                  letter-spacing:1px;
                "
              >
                EDUCAÇÃO • TECNOLOGIA • INOVAÇÃO
              </div>

            </td>

          </tr>


          <!-- CONTEÚDO -->
          <tr>

            <td
              style="
                padding:10px 45px 45px;
              "
            >

              <!-- TÍTULO -->
              <h1
                style="
                  margin:0 0 18px;
                  color:#18181b;
                  font-size:30px;
                  line-height:1.2;
                  font-weight:700;
                  letter-spacing:-0.7px;
                  text-align:center;
                "
              >
                Confirme seu e-mail
              </h1>


              <!-- TEXTO PRINCIPAL -->
              <p
                style="
                  margin:0 0 14px;
                  color:#52525b;
                  font-size:15px;
                  line-height:1.7;
                  text-align:center;
                "
              >
                Bem-vindo ao
                <strong style="color:#6d28d9;">
                  EducaCube
                </strong>.
              </p>


              <p
                style="
                  margin:0 0 28px;
                  color:#71717a;
                  font-size:15px;
                  line-height:1.7;
                  text-align:center;
                "
              >
                Para ativar sua conta e começar a utilizar
                a plataforma, confirme seu endereço de e-mail
                clicando no botão abaixo.
              </p>


              <!-- BOTÃO -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >

                <tr>

                  <td align="center">

                    <a
                      href="${verificationLink}"
                      style="
                        display:inline-block;
                        background-color:#7c3aed;
                        color:#ffffff;
                        text-decoration:none;
                        padding:15px 30px;
                        border-radius:10px;
                        font-size:14px;
                        font-weight:700;
                        letter-spacing:0.2px;
                        box-shadow:0 6px 16px rgba(124,58,237,0.25);
                      "
                    >
                      CONFIRMAR MEU E-MAIL
                    </a>

                  </td>

                </tr>

              </table>


              <!-- ESPAÇO -->
              <div style="height:32px;"></div>


              <!-- AVISO -->
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  background-color:#faf5ff;
                  border:1px solid #ede9fe;
                  border-radius:12px;
                "
              >

                <tr>

                  <td
                    style="
                      padding:18px 20px;
                    "
                  >

                    <p
                      style="
                        margin:0;
                        color:#6b21a8;
                        font-size:13px;
                        line-height:1.6;
                      "
                    >

                      <strong>Importante:</strong><br>

                      Este link foi gerado para confirmar
                      o endereço de e-mail utilizado na criação
                      da sua conta.

                    </p>

                  </td>

                </tr>

              </table>


              <!-- LINK ALTERNATIVO -->
              <p
                style="
                  margin:30px 0 8px;
                  color:#a1a1aa;
                  font-size:11px;
                  line-height:1.5;
                  text-align:center;
                "
              >
                Se o botão não funcionar, copie e cole
                o endereço abaixo no seu navegador:
              </p>


              <p
                style="
                  margin:0;
                  word-break:break-all;
                  text-align:center;
                "
              >

                <a
                  href="${verificationLink}"
                  style="
                    color:#7c3aed;
                    font-size:11px;
                    text-decoration:none;
                  "
                >
                  ${verificationLink}
                </a>

              </p>

            </td>

          </tr>


          <!-- DIVISÓRIA -->
          <tr>

            <td
              style="
                padding:0 45px;
              "
            >

              <div
                style="
                  height:1px;
                  background-color:#f4f4f5;
                "
              ></div>

            </td>

          </tr>


          <!-- FOOTER -->
          <tr>

            <td
              align="center"
              style="
                padding:28px 35px 35px;
              "
            >

              <p
                style="
                  margin:0 0 8px;
                  color:#6d28d9;
                  font-size:14px;
                  font-weight:700;
                "
              >
                EducaCube
              </p>


              <p
                style="
                  margin:0 0 15px;
                  color:#a1a1aa;
                  font-size:11px;
                  line-height:1.6;
                "
              >
                Uma experiência criada para aprender,
                explorar e evoluir.
              </p>


              <p
                style="
                  margin:0;
                  color:#c4c4c8;
                  font-size:10px;
                  line-height:1.5;
                "
              >
                Você recebeu este e-mail porque uma conta
                foi criada no EducaCube.
              </p>


              <p
                style="
                  margin:12px 0 0;
                  color:#d4d4d8;
                  font-size:10px;
                "
              >
                © 2026 EducaCube. Todos os direitos reservados.
              </p>

            </td>

          </tr>

        </table>


        <!-- TEXTO FORA DO CARD -->
        <p
          style="
            margin:18px 0 0;
            color:#a1a1aa;
            font-size:10px;
            text-align:center;
          "
        >
          Este é um e-mail automático. Por favor,
          não responda diretamente a esta mensagem.
        </p>

      </td>

    </tr>

  </table>

</body>

</html>
          `,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro Resend:", data);

      return res.status(500).json({
        error: "Erro ao enviar e-mail de verificação.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "E-mail de verificação enviado!",
    });

  } catch (error) {

    console.error(
      "ERRO API VERIFICAÇÃO:",
      error
    );

    return res.status(500).json({
      error: "Erro interno ao enviar verificação",
    });
  }
}
