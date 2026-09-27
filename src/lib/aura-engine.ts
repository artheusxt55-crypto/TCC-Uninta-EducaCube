import {
  getApps,
  getApp,
} from "firebase/app";

import {
  getAuth,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

const API_URL = "/api/chat";

export interface AuraFonte {
  titulo?: string;
  url?: string;
  fonte?: string;
}

export interface AuraResponse {
  resposta: string;
  fontesLab?: AuraFonte[];
  provider?: "gemini" | "groq";
  attempts?: number;
  usage?: {
    promptTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
  };
}

function obterAuth() {
  if (typeof window === "undefined") {
    return null;
  }

  const apps = getApps();

  if (apps.length === 0) {
    console.error(
      "[AURA] Nenhum aplicativo Firebase foi inicializado."
    );

    return null;
  }

  return getAuth(getApp());
}


export function obterUsuarioAura(): User | null {
  const auth = obterAuth();

  if (!auth) {
    return null;
  }

  return auth.currentUser;
}



async function aguardarUsuarioFirebase(): Promise<User | null> {
  const auth = obterAuth();

  if (!auth) {
    return null;
  }

  if (auth.currentUser) {
    return auth.currentUser;
  }

  return new Promise((resolve) => {
    let finalizado = false;

    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (finalizado) {
          return;
        }

        finalizado = true;
        unsubscribe();
        resolve(user);
      }
    );

    window.setTimeout(() => {
      if (finalizado) {
        return;
      }

      finalizado = true;
      unsubscribe();

      resolve(auth.currentUser);
    }, 5000);
  });
}


async function obterTokenFirebase(): Promise<{
  user: User;
  token: string;
}> {
  const user = await aguardarUsuarioFirebase();

  if (!user) {
    throw new Error(
      "Você precisa estar conectado à sua conta EducaCube para usar a AURA."
    );
  }

  const token = await user.getIdToken();

  if (!token) {
    throw new Error(
      "Não foi possível validar sua sessão. Entre novamente na sua conta."
    );
  }

  return {
    user,
    token,
  };
}


export async function perguntarAura(
  prompt: string,
  contexto: string[] = []
): Promise<AuraResponse> {
  const { user, token } =
    await obterTokenFirebase();

  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },

    body: JSON.stringify({
      prompt,
      contexto,

      
      clientUserId: user.uid,
    }),
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    let mensagem =
      "Erro ao comunicar com a AURA.";

    if (data?.error) {
      mensagem = data.error;
    }

    if (data?.message) {
      mensagem = data.message;
    }

    if (response.status === 401) {
      mensagem =
        data?.error ||
        "Sua sessão expirou. Entre novamente na sua conta.";
    }

    if (response.status === 429) {
      mensagem =
        data?.error ||
        "Você atingiu o limite de uso da AURA. Aguarde alguns minutos e tente novamente.";
    }

    if (response.status >= 500) {
      mensagem =
        data?.error ||
        "A AURA está temporariamente indisponível. Tente novamente em instantes.";
    }

    throw new Error(mensagem);
  }

  if (
    !data ||
    typeof data.resposta !== "string"
  ) {
    throw new Error(
      "A AURA retornou uma resposta inválida."
    );
  }

  return data as AuraResponse;
}



export function salvarHistoricoLocal(
  userId: string,
  conversa: unknown
): void {
  if (!userId) {
    return;
  }

  try {
    localStorage.setItem(
      `aura_history_${userId}`,
      JSON.stringify(conversa)
    );
  } catch (error) {
    console.error(
      "[AURA] Erro ao salvar histórico:",
      error
    );
  }
}

export function buscarHistoricoLocal<T = unknown>(
  userId: string
): T | null {
  if (!userId) {
    return null;
  }

  try {
    const dados = localStorage.getItem(
      `aura_history_${userId}`
    );

    if (!dados) {
      return null;
    }

    return JSON.parse(dados) as T;
  } catch (error) {
    console.error(
      "[AURA] Erro ao recuperar histórico:",
      error
    );

    return null;
  }
}

export function apagarHistoricoLocal(
  userId: string
): void {
  if (!userId) {
    return;
  }

  try {
    localStorage.removeItem(
      `aura_history_${userId}`
    );
  } catch (error) {
    console.error(
      "[AURA] Erro ao apagar histórico:",
      error
    );
  }
}


export function falarTexto(
  texto: string
): void {
  if (typeof window === "undefined") {
    return;
  }

  if (!("speechSynthesis" in window)) {
    console.warn(
      "[AURA] Speech Synthesis não disponível neste navegador."
    );

    return;
  }

  window.speechSynthesis.cancel();

  const utterance =
    new SpeechSynthesisUtterance(texto);

  utterance.lang = "pt-BR";
  utterance.rate = 1;
  utterance.pitch = 1;
  utterance.volume = 1;

  window.speechSynthesis.speak(
    utterance
  );
}

export function pararFala(): void {
  if (typeof window === "undefined") {
    return;
  }

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
