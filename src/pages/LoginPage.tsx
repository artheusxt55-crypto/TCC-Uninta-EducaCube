import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { auth, googleProvider, db } from "../lib/firebase";

import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";

import type { User } from "firebase/auth";

import {
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";

import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
} from "lucide-react";

import "../styles/login.css";

type ModoAutenticacao = "login" | "cadastro";
type TipoUsuario = "aluno" | "professor";

const EMAIL_SALVO_KEY = "educacube_saved_email";

function obterMensagemErroFirebase(error: unknown): string {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : "";

  switch (code) {
    case "auth/invalid-email":
      return "Digite um endereço de e-mail válido.";

    case "auth/user-not-found":
      return "Não encontramos uma conta com esse e-mail.";

    case "auth/wrong-password":
      return "A senha informada está incorreta.";

    case "auth/invalid-credential":
      return "E-mail ou senha incorretos.";

    case "auth/email-already-in-use":
      return "Este e-mail já possui uma conta.";

    case "auth/weak-password":
      return "A senha precisa ter pelo menos 6 caracteres.";

    case "auth/popup-closed-by-user":
      return "A janela do Google foi fechada.";

    case "auth/popup-blocked":
      return "O navegador bloqueou a janela de login do Google.";

    case "auth/account-exists-with-different-credential":
      return "Este e-mail já está associado a outro método de acesso.";

    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde alguns instantes e tente novamente.";

    case "auth/network-request-failed":
      return "Não foi possível conectar ao servidor. Verifique sua internet.";

    case "auth/operation-not-allowed":
      return "Este método de login ainda não está disponível.";

    case "auth/user-disabled":
      return "Esta conta foi desativada.";

    default:
      return "Não foi possível concluir o acesso. Tente novamente.";
  }
}

async function registrarUsuarioFirestore(
  user: User,
  nome?: string,
  tipoUsuario?: TipoUsuario,
) {
  const referencia = doc(db, "usuarios", user.uid);

  await setDoc(
    referencia,
    {
      uid: user.uid,
      nome:
        nome?.trim() ||
        user.displayName ||
        "Usuário EducaCube",
      email: user.email || "",
      foto: user.photoURL || "",
      ...(tipoUsuario ? { tipoUsuario } : {}),
      ultimoLogin: serverTimestamp(),
      criadoEm: serverTimestamp(),
    },
    {
      merge: true,
    },
  );
}

async function registrarAcessoApi(user: User) {
  try {
    const token = await user.getIdToken();

    await fetch("/api/registrar-acesso", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    // O login continua mesmo se o registro falhar.
  }
}

async function enviarVerificacaoApi(user: User) {
  try {
    const token = await user.getIdToken();

    await fetch("/api/enviar-verificacao", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    // A criação da conta não será bloqueada.
  }
}

export default function LoginPage() {
  const [modo, setModo] =
    useState<ModoAutenticacao>("login");

  const [tipoUsuario, setTipoUsuario] =
    useState<TipoUsuario>("aluno");

  const [emailInput, setEmailInput] = useState("");
  const [senhaInput, setSenhaInput] = useState("");
  const [confirmarSenhaInput, setConfirmarSenhaInput] =
    useState("");
  const [nomeInput, setNomeInput] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmacao, setMostrarConfirmacao] =
    useState(false);

  const [lembrarLogin, setLembrarLogin] = useState(false);

  const [carregandoAuth, setCarregandoAuth] =
    useState(false);

  const [mensagemErro, setMensagemErro] = useState("");
  const [mensagemSucesso, setMensagemSucesso] =
    useState("");

  useEffect(() => {
    const emailSalvo =
      window.localStorage.getItem(EMAIL_SALVO_KEY);

    if (emailSalvo) {
      setEmailInput(emailSalvo);
      setLembrarLogin(true);
    }
  }, []);

  function limparMensagens() {
    setMensagemErro("");
    setMensagemSucesso("");
  }

  function trocarModo(novoModo: ModoAutenticacao) {
    limparMensagens();
    setModo(novoModo);
  }

  async function finalizarLogin(user: User) {
    await registrarUsuarioFirestore(user, undefined, tipoUsuario);
    await registrarAcessoApi(user);

    if (lembrarLogin) {
      window.localStorage.setItem(
        EMAIL_SALVO_KEY,
        emailInput.trim(),
      );
    } else {
      window.localStorage.removeItem(EMAIL_SALVO_KEY);
    }

    window.location.href =
      tipoUsuario === "professor"
        ? "/app/dashboard/professor"
        : "/app/dashboard/aluno";
  }

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    limparMensagens();

    const email = emailInput.trim();

    if (!email || !senhaInput) {
      setMensagemErro(
        "Preencha seu e-mail e sua senha para continuar.",
      );
      return;
    }

    setCarregandoAuth(true);

    try {
      const resultado =
        await signInWithEmailAndPassword(
          auth,
          email,
          senhaInput,
        );

      await finalizarLogin(resultado.user);
    } catch (error) {
      setMensagemErro(
        obterMensagemErroFirebase(error),
      );
    } finally {
      setCarregandoAuth(false);
    }
  }

  async function handleCadastro(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    limparMensagens();

    const nome = nomeInput.trim();
    const email = emailInput.trim();

    if (
      !nome ||
      !email ||
      !senhaInput ||
      !confirmarSenhaInput
    ) {
      setMensagemErro(
        "Preencha todos os campos para criar sua conta.",
      );
      return;
    }

    if (senhaInput.length < 6) {
      setMensagemErro(
        "A senha precisa ter pelo menos 6 caracteres.",
      );
      return;
    }

    if (senhaInput !== confirmarSenhaInput) {
      setMensagemErro("As senhas não coincidem.");
      return;
    }

    setCarregandoAuth(true);

    try {
      const resultado =
        await createUserWithEmailAndPassword(
          auth,
          email,
          senhaInput,
        );

      await updateProfile(resultado.user, {
        displayName: nome,
      });

      await registrarUsuarioFirestore(
        resultado.user,
        nome,
        tipoUsuario,
      );

      await registrarAcessoApi(resultado.user);
      await enviarVerificacaoApi(resultado.user);

      window.location.href =
        tipoUsuario === "professor"
          ? "/app/dashboard/professor"
          : "/app/dashboard/aluno";
    } catch (error) {
      setMensagemErro(
        obterMensagemErroFirebase(error),
      );
    } finally {
      setCarregandoAuth(false);
    }
  }

  async function handleGoogleLogin() {
    limparMensagens();
    setCarregandoAuth(true);

    try {
      const resultado = await signInWithPopup(
        auth,
        googleProvider,
      );

      await registrarUsuarioFirestore(resultado.user, undefined, tipoUsuario);
      await registrarAcessoApi(resultado.user);

      window.location.href =
        tipoUsuario === "professor"
          ? "/app/dashboard/professor"
          : "/app/dashboard/aluno";
    } catch (error) {
      setMensagemErro(
        obterMensagemErroFirebase(error),
      );
    } finally {
      setCarregandoAuth(false);
    }
  }

  async function handleEsqueciSenha() {
    limparMensagens();

    const email = emailInput.trim();

    if (!email) {
      setMensagemErro(
        "Digite seu e-mail para receber o link de redefinição.",
      );
      return;
    }

    setCarregandoAuth(true);

    try {
      await sendPasswordResetEmail(auth, email);

      setMensagemSucesso(
        "Enviamos um link para redefinir sua senha.",
      );
    } catch (error) {
      setMensagemErro(
        obterMensagemErroFirebase(error),
      );
    } finally {
      setCarregandoAuth(false);
    }
  }

  const estaNoCadastro = modo === "cadastro";

  return (
    <main className="login-page">
      <div className="login-layout">

        <section className="login-left">
          <div className="login-container">

            <a
              href="/"
              className="login-logo"
              aria-label="Voltar para o EducaCube"
            >
              <span className="login-logo-mark">
                E
              </span>

              <span className="login-logo-text">
                Educa<span>Cube</span>
              </span>
            </a>

            <div className="login-card">

              <header className="login-header">
                <span className="login-eyebrow">
                  {estaNoCadastro
                    ? "NOVO ACESSO"
                    : tipoUsuario === "professor"
                      ? "ÁREA DO PROFESSOR"
                      : "ÁREA DO ALUNO"}
                </span>

                <h1 className="login-title">
                  {estaNoCadastro ? (
                    <>
                      Crie sua conta no{" "}
                      <span>EducaCube.</span>
                    </>
                  ) : (
                    <>
                      Bem-vindo de volta ao{" "}
                      <span>EducaCube.</span>
                    </>
                  )}
                </h1>

                <p className="login-description">
                  {estaNoCadastro
                    ? "Preencha seus dados para acessar o EducaCube."
                    : tipoUsuario === "professor"
                      ? "Acesse sua conta para continuar seu trabalho no EducaCube."
                      : "Acesse sua conta para continuar seus estudos no EducaCube."}
                </p>
              </header>

              <div className="login-role-selector" aria-label="Escolha seu perfil">
                <span className="login-role-label">Você está entrando como</span>
                <div className="login-role-options">
                  <button
                    type="button"
                    className={`login-role-option ${tipoUsuario === "aluno" ? "is-active" : ""}`}
                    onClick={() => setTipoUsuario("aluno")}
                    disabled={carregandoAuth}
                    aria-pressed={tipoUsuario === "aluno"}
                  >
                    <span className="login-role-option-title">Aluno</span>
                    <span className="login-role-option-description">Acessar meus estudos</span>
                  </button>

                  <button
                    type="button"
                    className={`login-role-option ${tipoUsuario === "professor" ? "is-active" : ""}`}
                    onClick={() => setTipoUsuario("professor")}
                    disabled={carregandoAuth}
                    aria-pressed={tipoUsuario === "professor"}
                  >
                    <span className="login-role-option-title">Professor</span>
                    <span className="login-role-option-description">Gerenciar minhas turmas</span>
                  </button>
                </div>
              </div>

              {mensagemErro && (
                <div
                  className="login-message login-message-error"
                  role="alert"
                >
                  {mensagemErro}
                </div>
              )}

              {mensagemSucesso && (
                <div
                  className="login-message login-message-success"
                  role="status"
                >
                  {mensagemSucesso}
                </div>
              )}

              <form
                className="login-form"
                onSubmit={
                  estaNoCadastro
                    ? handleCadastro
                    : handleLogin
                }
              >

                {estaNoCadastro && (
                  <label className="login-field">
                    <span className="login-label">
                      Nome
                    </span>

                    <div className="login-input-wrapper">
                      <UserRound
                        size={18}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />

                      <input
                        type="text"
                        value={nomeInput}
                        onChange={(event) =>
                          setNomeInput(event.target.value)
                        }
                        placeholder="Seu nome"
                        autoComplete="name"
                        disabled={carregandoAuth}
                      />
                    </div>
                  </label>
                )}

                <label className="login-field">
                  <span className="login-label">
                    E-mail
                  </span>

                  <div className="login-input-wrapper">
                    <Mail
                      size={18}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />

                    <input
                      type="email"
                      value={emailInput}
                      onChange={(event) =>
                        setEmailInput(event.target.value)
                      }
                      placeholder="seu@email.com"
                      autoComplete="email"
                      disabled={carregandoAuth}
                    />
                  </div>
                </label>

                <label className="login-field">
                  <span className="login-label">
                    Senha
                  </span>

                  <div className="login-input-wrapper">
                    <LockKeyhole
                      size={18}
                      strokeWidth={1.8}
                      aria-hidden="true"
                    />

                    <input
                      type={
                        mostrarSenha
                          ? "text"
                          : "password"
                      }
                      value={senhaInput}
                      onChange={(event) =>
                        setSenhaInput(event.target.value)
                      }
                      placeholder="Digite sua senha"
                      autoComplete={
                        estaNoCadastro
                          ? "new-password"
                          : "current-password"
                      }
                      disabled={carregandoAuth}
                    />

                    <button
                      type="button"
                      className="login-password-toggle"
                      onClick={() =>
                        setMostrarSenha(
                          (valor) => !valor,
                        )
                      }
                      aria-label={
                        mostrarSenha
                          ? "Ocultar senha"
                          : "Mostrar senha"
                      }
                      disabled={carregandoAuth}
                    >
                      {mostrarSenha ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </label>

                {estaNoCadastro && (
                  <label className="login-field">
                    <span className="login-label">
                      Confirmar senha
                    </span>

                    <div className="login-input-wrapper">
                      <LockKeyhole
                        size={18}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />

                      <input
                        type={
                          mostrarConfirmacao
                            ? "text"
                            : "password"
                        }
                        value={confirmarSenhaInput}
                        onChange={(event) =>
                          setConfirmarSenhaInput(
                            event.target.value,
                          )
                        }
                        placeholder="Digite a senha novamente"
                        autoComplete="new-password"
                        disabled={carregandoAuth}
                      />

                      <button
                        type="button"
                        className="login-password-toggle"
                        onClick={() =>
                          setMostrarConfirmacao(
                            (valor) => !valor,
                          )
                        }
                        aria-label={
                          mostrarConfirmacao
                            ? "Ocultar confirmação"
                            : "Mostrar confirmação"
                        }
                        disabled={carregandoAuth}
                      >
                        {mostrarConfirmacao ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </label>
                )}

                {!estaNoCadastro && (
                  <div className="login-options">
                    <label className="login-remember">
                      <input
                        type="checkbox"
                        checked={lembrarLogin}
                        onChange={(event) =>
                          setLembrarLogin(
                            event.target.checked,
                          )
                        }
                        disabled={carregandoAuth}
                      />

                      <span>
                        Lembrar de mim
                      </span>
                    </label>

                    <button
                      type="button"
                      className="login-forgot"
                      onClick={handleEsqueciSenha}
                      disabled={carregandoAuth}
                    >
                      Esqueceu sua senha?
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  className="login-primary-button"
                  disabled={carregandoAuth}
                >
                  <span>
                    {carregandoAuth
                      ? "Aguarde..."
                      : estaNoCadastro
                        ? "Criar conta"
                        : "Entrar"}
                  </span>

                  {!carregandoAuth && (
                    <ArrowRight size={18} />
                  )}
                </button>

              </form>

              <div className="login-divider">
                <span />
                <p>ou</p>
                <span />
              </div>

              <button
                type="button"
                className="login-google-button"
                onClick={handleGoogleLogin}
                disabled={carregandoAuth}
              >
                <svg
                  className="login-google-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fill="#4285F4"
                    d="M21.35 12.27c0-.72-.06-1.41-.18-2.07H12v3.92h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.24Z"
                  />

                  <path
                    fill="#34A853"
                    d="M12 21.5c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.5Z"
                  />

                  <path
                    fill="#FBBC05"
                    d="M6.54 13.58A5.86 5.86 0 0 1 6.23 12c0-.55.1-1.08.31-1.58V7.89H3.3A9.5 9.5 0 0 0 2.25 12c0 1.53.37 2.98 1.05 4.11l3.24-2.53Z"
                  />

                  <path
                    fill="#EA4335"
                    d="M12 6.39c1.43 0 2.71.49 3.72 1.46l2.79-2.79C16.84 3.45 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.7 5.39l3.24 2.53c.77-2.31 2.92-4.03 5.46-4.03Z"
                  />
                </svg>

                <span>
                  Continuar com Google
                </span>
              </button>

              <div className="login-switch">
                <span>
                  {estaNoCadastro
                    ? "Já possui uma conta?"
                    : "Ainda não tem uma conta?"}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    trocarModo(
                      estaNoCadastro
                        ? "login"
                        : "cadastro",
                    )
                  }
                >
                  {estaNoCadastro
                    ? "Entrar"
                    : "Criar conta"}
                </button>
              </div>

            </div>

            <footer className="login-footer">
              EducaCube · Área do {tipoUsuario === "professor" ? "Professor" : "Aluno"}
            </footer>

          </div>
        </section>

        <section className="login-right">
          <div className="login-right-content">

            <div className="login-right-brand">
              <span className="login-right-mark">
                E
              </span>

              <span className="login-right-brand-text">
                Educa<span>Cube</span>
              </span>
            </div>

            <div className="login-right-main">

              <span className="login-right-kicker">
                {tipoUsuario === "professor" ? "ÁREA DO PROFESSOR" : "ÁREA DO ALUNO"}
              </span>

              <h2>
                Estudos, materiais e apoio em um só lugar.
              </h2>

              <p>
                Organize seus estudos, consulte seus
                materiais e use a Aura quando precisar
                de ajuda para entender um conteúdo.
              </p>

              <div className="login-right-detail">
                <div className="login-detail-line" />

                <p>
                  Um ambiente pensado para acompanhar
                  sua rotina de estudos.
                </p>
              </div>

            </div>

            <div className="login-right-footer">
              <strong>EDUCACUBE</strong>

              <span>
                Seu ambiente de estudos.
              </span>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}

