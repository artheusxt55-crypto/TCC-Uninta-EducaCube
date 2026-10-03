import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import {
  motion,
  AnimatePresence,
  useReducedMotion,
} from "motion/react";

import {
  Box,
  MessageCircle,
  FileText,
  BookOpen,
  FilePenLine,
  Folder,
  Settings,
  Paperclip,
  Send,
  Square,
  Mic,
  Crown,
  User,
  WifiOff,
  Search,
  Plus,
  Pencil,
  Trash2,
  Copy,
  RotateCcw,
  ChevronDown,
  Volume2,
  VolumeX,
  AlertTriangle,
  Menu,
  X,
} from "lucide-react";

import NeuralOrb, {
  type AuraState,
} from "../components/NeuralOrb";

import MorphingSquare from "../components/MorphingSquare";

import { renderAuraMarkdown } from "../components/aura-markdown";

import { perguntarAura } from "../lib/aura-engine";

import "../styles/aura-ai.css";

                                                                   
        
                                                                      

interface NavItem {
  id: string;
  label: string;
  icon: typeof MessageCircle;
}

interface Suggestion {
  id: string;
  label: string;
  detail: string;
  icon: typeof BookOpen;
  prompt: string;
}

interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface AuraMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "complete" | "error";
  createdAt: number;
}

interface AuraConversation {
  id: string;
  title: string;
  messages: AuraMessage[];
  updatedAt: number;
}

interface ConversationSummary {
  id: string;
  title: string;
  messageCount: number;
  updatedAt: number;
}

interface SpeechRecognitionResultEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: (() => void) | null;
  onresult:
    | ((event: SpeechRecognitionResultEvent) => void)
    | null;
  onerror:
    | ((event: SpeechRecognitionErrorEvent) => void)
    | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

interface WindowWithSpeechRecognition extends Window {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
}

                                                                   
                 
                                                                      

const NAV_ITEMS: NavItem[] = [
  {
    id: "chat",
    label: "Chat IA",
    icon: MessageCircle,
  },
  {
    id: "estudos",
    label: "Meus Estudos",
    icon: FileText,
  },
  {
    id: "biblioteca",
    label: "Biblioteca",
    icon: BookOpen,
  },
  {
    id: "provas",
    label: "Provas e Exercícios",
    icon: FilePenLine,
  },
  {
    id: "materiais",
    label: "Materiais",
    icon: Folder,
  },
  {
    id: "config",
    label: "Configurações",
    icon: Settings,
  },
];

const SUGGESTIONS: Suggestion[] = [
  {
    id: "explicar",
    label: "Explique Piaget de forma simples",
    detail: "Conceito traduzido em linguagem clara",
    icon: BookOpen,
    prompt:
      "Explique a teoria de Piaget de forma simples, com um exemplo prático de sala de aula.",
  },
  {
    id: "exercicios",
    label: "Crie 10 questões sobre a BNCC",
    detail: "Banco de questões personalizado",
    icon: FilePenLine,
    prompt:
      "Crie 10 questões de múltipla escolha sobre a BNCC, com gabarito comentado.",
  },
  {
    id: "plano-aula",
    label: "Transforme este texto em um plano de aula",
    detail: "Estrutura pedagógica pronta para aplicar",
    icon: FileText,
    prompt:
      "Transforme o seguinte texto em um plano de aula estruturado: ",
  },
  {
    id: "comparar",
    label: "Compare duas teorias pedagógicas",
    detail: "Análise lado a lado, com aplicações",
    icon: Folder,
    prompt:
      "Compare a pedagogia de Piaget com a de Vygotsky, destacando aplicações práticas.",
  },
];

                                                                   
          
                                                                      

const STORAGE_KEY = "educacube_aura_conversations";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

                                                                   
         
                                                                      

const easePremium = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 18,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.65,
      ease: easePremium,
    },
  },
};

const listContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.065,
      delayChildren: 0.08,
    },
  },
};

const listItem = {
  hidden: {
    opacity: 0,
    y: 10,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.48,
      ease: easePremium,
    },
  },
};

                                                                   
          
                                                                      

function generateId(): string {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function createInitialHistory(): AuraConversation[] {
  const now = Date.now();

  return [
    {
      id: "c1",
      title: "Sequência didática sobre frações",
      messages: [],
      updatedAt: now - 2 * HOUR,
    },
    {
      id: "c2",
      title: "Resumo do capítulo 4 — Ecologia",
      messages: [],
      updatedAt: now - 5 * HOUR,
    },
    {
      id: "c3",
      title: "Questões de vestibular — Literatura",
      messages: [],
      updatedAt: now - 26 * HOUR,
    },
    {
      id: "c4",
      title: "Plano de aula — Revolução Industrial",
      messages: [],
      updatedAt: now - 3 * DAY,
    },
    {
      id: "c5",
      title: "Comparação Piaget x Vygotsky",
      messages: [],
      updatedAt: now - 6 * DAY,
    },
    {
      id: "c6",
      title: "Redação ENEM — estrutura dissertativa",
      messages: [],
      updatedAt: now - 20 * DAY,
    },
  ];
}

function loadStoredConversations(): AuraConversation[] {
  if (typeof window === "undefined") {
    return createInitialHistory();
  }

  try {
    const stored = window.localStorage.getItem(
      STORAGE_KEY
    );

    if (!stored) {
      return createInitialHistory();
    }

    const parsed = JSON.parse(
      stored
    ) as AuraConversation[];

    if (!Array.isArray(parsed)) {
      return createInitialHistory();
    }

    return parsed;
  } catch {
    return createInitialHistory();
  }
}

function saveConversations(
  conversations: AuraConversation[]
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(conversations)
    );
  } catch {
                                   
  }
}

function getConversationSummaries(
  conversations: AuraConversation[]
): ConversationSummary[] {
  return conversations
    .map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      messageCount:
        conversation.messages.length,
      updatedAt: conversation.updatedAt,
    }))
    .sort(
      (a, b) =>
        b.updatedAt - a.updatedAt
    );
}

function createConversationTitle(
  text: string
): string {
  const clean = text
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length <= 48) {
    return clean;
  }

  return `${clean.slice(0, 48)}…`;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, " código ")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    .replace(/[-•]\s/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function groupHistory(
  items: ConversationSummary[]
) {
  const groups: {
    label: string;
    items: ConversationSummary[];
  }[] = [
    {
      label: "Hoje",
      items: [],
    },
    {
      label: "Ontem",
      items: [],
    },
    {
      label: "Últimos 7 dias",
      items: [],
    },
    {
      label: "Anteriores",
      items: [],
    },
  ];

  for (const item of items) {
    const diffDays = Math.floor(
      (Date.now() - item.updatedAt) /
        DAY
    );

    if (diffDays < 1) {
      groups[0].items.push(item);
    } else if (diffDays < 2) {
      groups[1].items.push(item);
    } else if (diffDays < 7) {
      groups[2].items.push(item);
    } else {
      groups[3].items.push(item);
    }
  }

  return groups.filter(
    (group) => group.items.length > 0
  );
}

const AURA_STATE_LABELS: Record<
  AuraState,
  string
> = {
  idle: "Em espera",
  listening: "Ouvindo",
  sending: "Enviando mensagem",
  thinking: "Processando",
  generating: "Gerando resposta",
  complete: "Resposta concluída",
  speaking: "Falando",
  error: "Ocorreu um erro",
  offline: "Sem conexão",
};

                                                                   
                 
                                                                      

function AnimatedWelcomeTitle({
  reducedMotion,
}: {
  reducedMotion: boolean;
}) {
  const firstLine =
    "A inteligência educacional";

  const secondBefore =
    "do ";

  const accent =
    "EducaCube";

  const secondAfter =
    ", à sua disposição.";

  const renderCharacters = (
    text: string,
    offset: number,
    className = ""
  ) =>
    Array.from(text).map(
      (character, index) => {
        const delay =
          0.12 +
          (offset + index) * 0.018;

        if (reducedMotion) {
          return (
            <span
              key={`${offset}-${index}`}
              className={`aura-title-char ${className}`}
            >
              {character === " "
                ? "\u00A0"
                : character}
            </span>
          );
        }

        return (
          <motion.span
            key={`${offset}-${index}`}
            className={`aura-title-char ${className}`}
            initial={{
              opacity: 0,
              y: 18,
              filter: "blur(7px)",
              scale: 0.985,
            }}
            animate={{
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              scale: 1,
            }}
            transition={{
              duration: 0.62,
              delay,
              ease: easePremium,
            }}
          >
            {character === " "
              ? "\u00A0"
              : character}
          </motion.span>
        );
      }
    );

  return (
    <div
      className="aura-welcome-title"
      aria-label="A inteligência educacional do EducaCube, à sua disposição."
    >
      <span className="aura-title-line">
        {renderCharacters(
          firstLine,
          0
        )}
      </span>

      <br />

      <span className="aura-title-line">
        {renderCharacters(
          secondBefore,
          firstLine.length
        )}

        <em>
          {renderCharacters(
            accent,
            firstLine.length +
              secondBefore.length,
            "aura-title-accent"
          )}
        </em>

        {renderCharacters(
          secondAfter,
          firstLine.length +
            secondBefore.length +
            accent.length
        )}
      </span>
    </div>
  );
}

                                                                   
            
                                                                      

export default function AuraEducacube() {
  const reducedMotion =
    useReducedMotion();

                                                                     
                    
                                                                        

  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia(
      "(hover: none) and (pointer: coarse)"
    );

    setIsTouch(mq.matches);

    const handler = (
      event: MediaQueryListEvent
    ) => setIsTouch(event.matches);

    if (mq.addEventListener) {
      mq.addEventListener(
        "change",
        handler
      );

      return () =>
        mq.removeEventListener(
          "change",
          handler
        );
    }

    mq.addListener(handler);

    return () =>
      mq.removeListener(handler);
  }, []);

  const hoverEnabled =
    !isTouch && !reducedMotion;

  const hoverProps = <T extends object>(
    props: T
  ) =>
    hoverEnabled ? props : undefined;

                                                                     
          
                                                                        

  const [
    activeNav,
    setActiveNav,
  ] = useState("chat");

    
                
                           
     
  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  const [
    messages,
    setMessages,
  ] = useState<AuraMessage[]>([]);

  const [
    input,
    setInput,
  ] = useState("");

  const [
    attachments,
    setAttachments,
  ] = useState<Attachment[]>([]);

  const [
    isDragOver,
    setIsDragOver,
  ] = useState(false);

  const [
    auraState,
    setAuraState,
  ] =
    useState<AuraState>("idle");

  const [
    micActive,
    setMicActive,
  ] = useState(false);

  const [
    audioLevel,
    setAudioLevel,
  ] = useState(0);

  const [
    speakingMessageId,
    setSpeakingMessageId,
  ] = useState<string | null>(
    null
  );

  const [
    copiedMessageId,
    setCopiedMessageId,
  ] = useState<string | null>(
    null
  );

  const [
    historySearch,
    setHistorySearch,
  ] = useState("");

  const [
    conversations,
    setConversations,
  ] = useState<AuraConversation[]>(
    loadStoredConversations
  );

  const [
    activeConversationId,
    setActiveConversationId,
  ] = useState<string | null>(
    null
  );

  const [
    isOnline,
    setIsOnline,
  ] = useState(
    typeof navigator !== "undefined"
      ? navigator.onLine
      : true
  );

  const [
    showScrollToLatest,
    setShowScrollToLatest,
  ] = useState(false);

  const [
    editingConversationId,
    setEditingConversationId,
  ] = useState<string | null>(
    null
  );

  const [
    editingConversationTitle,
    setEditingConversationTitle,
  ] = useState("");

  const scrollRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(
      null
    );

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null
    );

  const thinkingTimeoutRef =
    useRef<number | null>(null);

  const generatingTimeoutRef =
    useRef<number | null>(null);

  const completeTimeoutRef =
    useRef<number | null>(null);

  const generationTokenRef =
    useRef(0);

  const speechRef =
    useRef<SpeechSynthesisUtterance | null>(
      null
    );

  const recognitionRef =
    useRef<SpeechRecognitionInstance | null>(
      null
    );

  const hasConversation =
    messages.length > 0;

                                                                     
            
                                                                        

  useEffect(() => {
    saveConversations(
      conversations
    );
  }, [conversations]);

                                                                     
           
                                                                        

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);

      setAuraState((current) =>
        current === "offline"
          ? "idle"
          : current
      );
    };

    const goOffline = () => {
      setIsOnline(false);
      setAuraState("offline");
    };

    window.addEventListener(
      "online",
      goOnline
    );

    window.addEventListener(
      "offline",
      goOffline
    );

    return () => {
      window.removeEventListener(
        "online",
        goOnline
      );

      window.removeEventListener(
        "offline",
        goOffline
      );
    };
  }, []);

                                                                     
                     
                                                                        

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    if (!sidebarOpen) {
      return;
    }

    const previousOverflow =
      document.body.style.overflow;

    const previousPaddingRight =
      document.body.style.paddingRight;

    const scrollbarWidth =
      window.innerWidth -
      document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      document.body.style.paddingRight =
        `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.body.style.paddingRight =
        previousPaddingRight;
    };
  }, [sidebarOpen]);

                                                                     
                      
                                                                        

  useEffect(() => {
    const element =
      textareaRef.current;

    if (!element) return;

    element.style.height = "auto";

    element.style.height = `${Math.min(
      element.scrollHeight,
      180
    )}px`;
  }, [input]);

                                                                     
                          
                                                                        

  useEffect(() => {
    if (!micActive) {
      setAudioLevel(0);
      return;
    }

    const interval =
      window.setInterval(() => {
        setAudioLevel(
          0.25 +
            Math.random() * 0.75
        );
      }, 120);

    return () =>
      window.clearInterval(
        interval
      );
  }, [micActive]);

                                                                     
            
                                                                        

  useEffect(() => {
    return () => {
      if (
        thinkingTimeoutRef.current
      ) {
        window.clearTimeout(
          thinkingTimeoutRef.current
        );
      }

      if (
        generatingTimeoutRef.current
      ) {
        window.clearTimeout(
          generatingTimeoutRef.current
        );
      }

      if (
        completeTimeoutRef.current
      ) {
        window.clearTimeout(
          completeTimeoutRef.current
        );
      }

      recognitionRef.current?.abort();

      if (
        typeof window !== "undefined" &&
        "speechSynthesis" in window
      ) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

                                                                     
           
                                                                        

  function isNearBottom(
    element: HTMLDivElement
  ) {
    return (
      element.scrollHeight -
        element.scrollTop -
        element.clientHeight <
      120
    );
  }

  useEffect(() => {
    const element =
      scrollRef.current;

    if (!element) return;

    if (isNearBottom(element)) {
      element.scrollTop =
        element.scrollHeight;

      setShowScrollToLatest(false);
    } else {
      setShowScrollToLatest(true);
    }
  }, [messages, auraState]);

  function handleMessagesScroll() {
    const element =
      scrollRef.current;

    if (!element) return;

    setShowScrollToLatest(
      !isNearBottom(element)
    );
  }

  function scrollToLatest() {
    const element =
      scrollRef.current;

    if (!element) return;

    element.scrollTo({
      top: element.scrollHeight,
      behavior: "smooth",
    });

    setShowScrollToLatest(false);
  }

                                                                     
               
                                                                        

  function clearGenerationTimers() {
    generationTokenRef.current += 1;

    if (
      thinkingTimeoutRef.current
    ) {
      window.clearTimeout(
        thinkingTimeoutRef.current
      );

      thinkingTimeoutRef.current = null;
    }

    if (
      generatingTimeoutRef.current
    ) {
      window.clearTimeout(
        generatingTimeoutRef.current
      );

      generatingTimeoutRef.current = null;
    }

    if (
      completeTimeoutRef.current
    ) {
      window.clearTimeout(
        completeTimeoutRef.current
      );

      completeTimeoutRef.current = null;
    }
  }

  function updateConversationMessages(
    conversationId: string,
    nextMessages: AuraMessage[]
  ) {
    setConversations((previous) =>
      previous.map(
        (conversation) =>
          conversation.id ===
          conversationId
            ? {
                ...conversation,
                messages:
                  nextMessages,
                updatedAt:
                  Date.now(),
              }
            : conversation
      )
    );
  }

  function ensureConversation(
    firstMessage: string
  ): string {
    if (activeConversationId) {
      const existing =
        conversations.find(
          (conversation) =>
            conversation.id ===
            activeConversationId
        );

      if (existing) {
        return existing.id;
      }
    }

    const id = generateId();

    const conversation: AuraConversation =
      {
        id,
        title:
          createConversationTitle(
            firstMessage
          ),
        messages: [],
        updatedAt: Date.now(),
      };

    setConversations(
      (previous) => [
        conversation,
        ...previous,
      ]
    );

    setActiveConversationId(id);

    return id;
  }

  async function appendAssistantResponse(
    conversationId: string,
    token: number,
    promptText: string,
    historyForContext: AuraMessage[]
  ) {
    if (
      token !==
      generationTokenRef.current
    ) {
      return;
    }

    setAuraState("generating");

    try {
      const contexto = historyForContext
        .filter(
          (message) =>
            message.status !== "error"
        )
        .slice(-8)
        .map(
          (message) =>
            `${
              message.role === "user"
                ? "Professor"
                : "AURA"
            }: ${message.content}`
        );

      const resposta =
        await perguntarAura(
          promptText,
          contexto
        );

      if (
        token !==
        generationTokenRef.current
      ) {
        return;
      }

      const assistantMessage: AuraMessage =
        {
          id: generateId(),
          role: "assistant",
          content:
            resposta.resposta?.trim() ||
            "Não recebi uma resposta válida agora. Tente novamente.",
          status: "complete",
          createdAt: Date.now(),
        };

      setMessages((previous) => {
        const next = [
          ...previous,
          assistantMessage,
        ];

        updateConversationMessages(
          conversationId,
          next
        );

        return next;
      });

      setAuraState("complete");

      completeTimeoutRef.current =
        window.setTimeout(() => {
          if (
            token !==
            generationTokenRef.current
          ) {
            return;
          }

          setAuraState(
            isOnline
              ? "idle"
              : "offline"
          );
        }, 900);
    } catch (error) {
      if (
        token !==
        generationTokenRef.current
      ) {
        return;
      }

      console.error(
        "Erro ao consultar a AURA:",
        error
      );

      const errorMessage: AuraMessage =
        {
          id: generateId(),
          role: "assistant",
          content: "",
          status: "error",
          createdAt: Date.now(),
        };

      setMessages((previous) => {
        const next = [
          ...previous,
          errorMessage,
        ];

        updateConversationMessages(
          conversationId,
          next
        );

        return next;
      });

      setAuraState("error");

      completeTimeoutRef.current =
        window.setTimeout(() => {
          if (
            token !==
            generationTokenRef.current
          ) {
            return;
          }

          setAuraState(
            isOnline
              ? "idle"
              : "offline"
          );
        }, 1200);
    }
  }

  function runGeneration(
    conversationId: string,
    promptText: string,
    historyForContext: AuraMessage[]
  ) {
    clearGenerationTimers();

    const token =
      generationTokenRef.current;

    setAuraState("thinking");

    thinkingTimeoutRef.current =
      window.setTimeout(() => {
        if (
          token !==
          generationTokenRef.current
        ) {
          return;
        }

        void appendAssistantResponse(
          conversationId,
          token,
          promptText,
          historyForContext
        );
      }, 600);
  }

                                                                     
         
                                                                        

  function sendMessage(text: string) {
    const trimmed =
      text.trim();

    if (
      !trimmed ||
      !isOnline
    ) {
      return;
    }

    clearGenerationTimers();

    if (micActive) {
      stopMicrophone();
    }

    const conversationId =
      ensureConversation(
        trimmed
      );

    const userMessage: AuraMessage =
      {
        id: generateId(),
        role: "user",
        content: trimmed,
        createdAt: Date.now(),
      };

    let historySnapshot: AuraMessage[] =
      [];

    setMessages((previous) => {
      const next = [
        ...previous,
        userMessage,
      ];

      historySnapshot = next;

      updateConversationMessages(
        conversationId,
        next
      );

      return next;
    });

    setInput("");
    setAttachments([]);

    runGeneration(
      conversationId,
      trimmed,
      historySnapshot
    );
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>
  ) {
    const isTouchDevice =
      typeof window !== "undefined" &&
      window.matchMedia(
        "(hover: none) and (pointer: coarse)"
      ).matches;

    if (isTouchDevice) {
      if (
        event.key === "Enter" &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        sendMessage(input);
      }

      return;
    }

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      sendMessage(input);
    }
  }

  function handleGlobalKeyDown(
    event: KeyboardEvent<HTMLDivElement>
  ) {
    if (event.key === "Escape") {
      if (sidebarOpen) {
        setSidebarOpen(false);
      }

      if (micActive) {
        stopMicrophone();
      }

      if (editingConversationId) {
        cancelRename();
      }
    }
  }

                                                                     
         
                                                                        

  function handleStopGenerating() {
    clearGenerationTimers();

    setAuraState(
      isOnline ? "idle" : "offline"
    );
  }

                                                                     
          
                                                                        

  function addFiles(
    fileList: FileList | null
  ) {
    if (!fileList) return;

    const files =
      Array.from(fileList).map(
        (file) => ({
          id: generateId(),
          name: file.name,
          size: file.size,
          type: file.type,
        })
      );

    setAttachments(
      (previous) => [
        ...previous,
        ...files,
      ]
    );
  }

  function handleFileInputChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    addFiles(event.target.files);

    event.target.value = "";
  }

  function handleDrop(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();

    setIsDragOver(false);

    addFiles(event.dataTransfer.files);
  }

  function handleDragOver(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave(
    event: DragEvent<HTMLDivElement>
  ) {
    event.preventDefault();
    setIsDragOver(false);
  }

  function removeAttachment(id: string) {
    setAttachments((previous) =>
      previous.filter(
        (file) => file.id !== id
      )
    );
  }

                                                                     
               
                                                                        

  function stopMicrophone() {
    try {
      recognitionRef.current?.stop();
    } catch {
                        
    }

    recognitionRef.current = null;

    setMicActive(false);
    setAudioLevel(0);

    setAuraState(
      isOnline ? "idle" : "offline"
    );
  }

  function startMicrophone() {
    if (!isOnline) return;

    const speechWindow =
      window as WindowWithSpeechRecognition;

    const Recognition =
      speechWindow.SpeechRecognition ||
      speechWindow.webkitSpeechRecognition;

    if (!Recognition) {
      alert(
        "Seu navegador não oferece reconhecimento de voz. Tente usar o Google Chrome ou Opera."
      );

      return;
    }

    if (recognitionRef.current) {
      stopMicrophone();
      return;
    }

    const recognition = new Recognition();

    recognition.lang = "pt-BR";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      recognitionRef.current = recognition;

      setMicActive(true);
      setAuraState("listening");
    };

    recognition.onresult = (event) => {
      let transcript = "";

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i += 1
      ) {
        transcript +=
          event.results[i][0].transcript;
      }

      const cleanTranscript =
        transcript.trim();

      if (!cleanTranscript) return;

      setInput((previous) => {
        const separator = previous.trim()
          ? " "
          : "";

        return `${previous}${separator}${cleanTranscript}`;
      });
    };

    recognition.onerror = () => {
      recognitionRef.current = null;

      setMicActive(false);
      setAudioLevel(0);

      setAuraState(
        isOnline ? "idle" : "offline"
      );
    };

    recognition.onend = () => {
      recognitionRef.current = null;

      setMicActive(false);
      setAudioLevel(0);

      setAuraState(
        isOnline ? "idle" : "offline"
      );
    };

    recognitionRef.current = recognition;

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;

      setMicActive(false);

      setAuraState(
        isOnline ? "idle" : "offline"
      );
    }
  }

  function toggleMic() {
    if (micActive) {
      stopMicrophone();
    } else {
      startMicrophone();
    }
  }

                                                                     
           
                                                                        

  function toggleSpeak(message: AuraMessage) {
    if (
      typeof window === "undefined" ||
      !("speechSynthesis" in window)
    ) {
      alert(
        "Seu navegador não oferece leitura de voz."
      );

      return;
    }

    if (speakingMessageId === message.id) {
      window.speechSynthesis.cancel();

      speechRef.current = null;

      setSpeakingMessageId(null);

      setAuraState(
        isOnline ? "idle" : "offline"
      );

      return;
    }

    window.speechSynthesis.cancel();

    const isIOS =
      typeof navigator !== "undefined" &&
      /iPad|iPhone|iPod/.test(
        navigator.userAgent
      );

    if (isIOS) {
      const warmup =
        new SpeechSynthesisUtterance("");

      warmup.volume = 0;

      window.speechSynthesis.speak(
        warmup
      );
    }

    const utterance =
      new SpeechSynthesisUtterance(
        stripMarkdown(message.content)
      );

    utterance.lang = "pt-BR";
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setSpeakingMessageId(message.id);
      setAuraState("speaking");
    };

    utterance.onend = () => {
      setSpeakingMessageId(null);
      speechRef.current = null;

      setAuraState(
        isOnline ? "idle" : "offline"
      );
    };

    utterance.onerror = () => {
      setSpeakingMessageId(null);
      speechRef.current = null;

      setAuraState(
        isOnline ? "idle" : "offline"
      );
    };

    speechRef.current = utterance;

    window.speechSynthesis.speak(
      utterance
    );
  }

                                                                     
         
                                                                        

  async function copyMessage(
    message: AuraMessage
  ) {
    try {
      await navigator.clipboard.writeText(
        message.content
      );

      setCopiedMessageId(message.id);

      window.setTimeout(() => {
        setCopiedMessageId((current) =>
          current === message.id
            ? null
            : current
        );
      }, 1600);
    } catch {
      try {
        const textarea =
          document.createElement(
            "textarea"
          );

        textarea.value =
          message.content;

        textarea.style.position =
          "fixed";

        textarea.style.opacity = "0";

        document.body.appendChild(
          textarea
        );

        textarea.select();

        document.execCommand(
          "copy"
        );

        textarea.remove();

        setCopiedMessageId(
          message.id
        );

        window.setTimeout(() => {
          setCopiedMessageId(
            (current) =>
              current === message.id
                ? null
                : current
          );
        }, 1600);
      } catch {
                                
      }
    }
  }

                                                                     
               
                                                                        

  function regenerate(messageId: string) {
    const index = messages.findIndex(
      (message) =>
        message.id === messageId
    );

    if (index === -1) return;

    const previousUser = [...messages]
      .slice(0, index)
      .reverse()
      .find(
        (message) =>
          message.role === "user"
      );

    if (!previousUser) return;

    if (!activeConversationId) return;

    clearGenerationTimers();

    const updatedMessages =
      messages.filter(
        (message) =>
          message.id !== messageId
      );

    setMessages(updatedMessages);

    updateConversationMessages(
      activeConversationId,
      updatedMessages
    );

    runGeneration(
      activeConversationId,
      previousUser.content,
      updatedMessages
    );
  }

  function retryLastMessage() {
    const lastUserMessage = [...messages]
      .reverse()
      .find(
        (message) =>
          message.role === "user"
      );

    if (
      !lastUserMessage ||
      !activeConversationId
    ) {
      return;
    }

    clearGenerationTimers();

    runGeneration(
      activeConversationId,
      lastUserMessage.content,
      messages
    );
  }

                                                                     
                  
                                                                        

  function startNewConversation() {
    clearGenerationTimers();

    if (micActive) {
      stopMicrophone();
    }

    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }

    speechRef.current = null;

    setMessages([]);
    setInput("");
    setAttachments([]);
    setActiveConversationId(null);
    setSpeakingMessageId(null);
    setCopiedMessageId(null);

    setEditingConversationId(null);
    setEditingConversationTitle("");

    setAuraState(
      isOnline ? "idle" : "offline"
    );

    setSidebarOpen(false);
  }

  function openConversation(id: string) {
    clearGenerationTimers();

    const conversation =
      conversations.find(
        (item) => item.id === id
      );

    if (!conversation) return;

    if (
      typeof window !== "undefined" &&
      "speechSynthesis" in window
    ) {
      window.speechSynthesis.cancel();
    }

    setActiveConversationId(id);
    setMessages(
      conversation.messages
    );
    setInput("");
    setAttachments([]);
    setSpeakingMessageId(null);
    setCopiedMessageId(null);

    setAuraState(
      isOnline ? "idle" : "offline"
    );

    setSidebarOpen(false);

    window.setTimeout(() => {
      const element =
        scrollRef.current;

      if (!element) return;

      element.scrollTop =
        element.scrollHeight;
    }, 50);
  }

                                                                     
           
                                                                        

  function startRenameConversation(
    event: MouseEvent,
    conversation: ConversationSummary
  ) {
    event.stopPropagation();

    setEditingConversationId(
      conversation.id
    );

    setEditingConversationTitle(
      conversation.title
    );
  }

  function cancelRename() {
    setEditingConversationId(null);
    setEditingConversationTitle("");
  }

  function saveRenameConversation(
    id: string
  ) {
    const title =
      editingConversationTitle.trim();

    if (!title) {
      cancelRename();
      return;
    }

    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === id
          ? {
              ...conversation,
              title,
              updatedAt: Date.now(),
            }
          : conversation
      )
    );

    cancelRename();
  }

  function handleRenameKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
    id: string
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      saveRenameConversation(id);
    }

    if (event.key === "Escape") {
      cancelRename();
    }
  }

                                                                     
           
                                                                        

  function deleteConversation(
    event: MouseEvent,
    id: string
  ) {
    event.stopPropagation();

    const conversation =
      conversations.find(
        (item) => item.id === id
      );

    if (!conversation) return;

    const confirmed = window.confirm(
      `Excluir a conversa "${conversation.title}"?`
    );

    if (!confirmed) return;

    setConversations((previous) =>
      previous.filter(
        (item) => item.id !== id
      )
    );

    if (
      activeConversationId === id
    ) {
      clearGenerationTimers();

      setActiveConversationId(null);
      setMessages([]);

      setAuraState(
        isOnline ? "idle" : "offline"
      );
    }
  }

                                                                     
               
                                                                        

  function handleNavigation(id: string) {
    setActiveNav(id);

    if (
      window.innerWidth <= 900
    ) {
      setSidebarOpen(false);
    }
  }

                                                                     
            
                                                                        

  const history = useMemo(
    () =>
      getConversationSummaries(
        conversations
      ),
    [conversations]
  );

  const filteredHistory =
    useMemo(() => {
      const query =
        historySearch
          .trim()
          .toLowerCase();

      if (!query) return history;

      return history.filter(
        (conversation) =>
          conversation.title
            .toLowerCase()
            .includes(query)
      );
    }, [
      history,
      historySearch,
    ]);

  const historyGroups =
    useMemo(
      () =>
        groupHistory(
          filteredHistory
        ),
      [filteredHistory]
    );

  const isBusy =
    auraState === "thinking" ||
    auraState === "generating";

                                                                     
           
                                                                        

  return (
    <div
      className="aura-page"
      onKeyDown={handleGlobalKeyDown}
    >
      <div className="aura-layout">

        {                                                             
                          
                                                                         }

        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              className="aura-mobile-overlay is-visible"
              initial={
                reducedMotion
                  ? false
                  : { opacity: 0 }
              }
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.25,
              }}
              onClick={() =>
                setSidebarOpen(false)
              }
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        {                                                             
                   
                                                                         }

        <motion.aside
          id="aura-sidebar"
          className={`aura-sidebar ${
            sidebarOpen
              ? "open"
              : ""
          }`}
            
                        
                               
                                               
             
          initial={
            reducedMotion
              ? false
              : {
                  opacity: 0,
                }
          }
          animate={{
            opacity: 1,
          }}
          transition={{
            duration: 0.55,
            ease: easePremium,
          }}
        >
          <div className="aura-sidebar-top">
            <motion.div
              className="aura-brand"
              initial={
                reducedMotion
                  ? false
                  : {
                      opacity: 0,
                      y: -8,
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.1,
                duration: 0.5,
                ease: easePremium,
              }}
            >
              <div className="aura-brand-mark">
                <Box
                  size={24}
                  strokeWidth={1.6}
                />
              </div>

              <div className="aura-brand-name">
                EducaCube

                <b>
                  AURA · Inteligência
                  Educacional
                </b>
              </div>
            </motion.div>

            <motion.button
              type="button"
              className="aura-drawer-close"
              onClick={() =>
                setSidebarOpen(false)
              }
              aria-label="Fechar menu"
              whileHover={hoverProps({
                rotate: 90,
                scale: 1.08,
              })}
              whileTap={
                reducedMotion
                  ? undefined
                  : { scale: 0.9 }
              }
            >
              <X size={16} />
            </motion.button>
          </div>

          <div className="aura-sidebar-top">
            <motion.button
              type="button"
              className="aura-new-chat"
              onClick={
                startNewConversation
              }
              whileHover={hoverProps({
                y: -2,
                scale: 1.008,
              })}
              whileTap={
                reducedMotion
                  ? undefined
                  : {
                      scale: 0.985,
                    }
              }
            >
              <Plus size={15} />

              <span>
                Nova conversa
              </span>
            </motion.button>
          </div>

          <motion.nav
            className="aura-navigation"
            variants={
              listContainer
            }
            initial="hidden"
            animate="visible"
          >
            {NAV_ITEMS.map(
              (item) => {
                const Icon =
                  item.icon;

                const active =
                  activeNav ===
                  item.id;

                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    className={`aura-nav-item ${
                      active
                        ? "active"
                        : ""
                    }`}
                    onClick={() =>
                      handleNavigation(
                        item.id
                      )
                    }
                    variants={
                      listItem
                    }
                    whileHover={hoverProps(
                      {
                        x: 3,
                      }
                    )}
                    whileTap={
                      reducedMotion
                        ? undefined
                        : {
                            scale: 0.985,
                          }
                    }
                  >
                    <Icon
                      size={17}
                      strokeWidth={1.8}
                    />

                    <span>
                      {item.label}
                    </span>
                  </motion.button>
                );
              }
            )}
          </motion.nav>

          {             }

          <motion.div
            className="aura-history"
            initial={
              reducedMotion
                ? false
                : {
                    opacity: 0,
                    y: 8,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.25,
              duration: 0.5,
              ease: easePremium,
            }}
          >
            <div className="aura-history-search">
              <Search size={13} />

              <input
                value={
                  historySearch
                }
                onChange={(
                  event
                ) =>
                  setHistorySearch(
                    event.target
                      .value
                  )
                }
                placeholder="Buscar conversas"
                aria-label="Buscar conversas"
              />
            </div>

            <AnimatePresence mode="popLayout">
              {historyGroups.length ===
                0 && (
                <motion.p
                  className="aura-history-empty"
                  initial={
                    reducedMotion
                      ? false
                      : {
                          opacity: 0,
                        }
                  }
                  animate={{
                    opacity: 1,
                  }}
                  exit={{
                    opacity: 0,
                  }}
                >
                  Nenhuma conversa
                  encontrada.
                </motion.p>
              )}
            </AnimatePresence>

            {historyGroups.map(
              (group) => (
                <motion.div
                  key={
                    group.label
                  }
                  variants={
                    reducedMotion
                      ? undefined
                      : listContainer
                  }
                  initial={
                    reducedMotion
                      ? false
                      : "hidden"
                  }
                  animate={
                    reducedMotion
                      ? undefined
                      : "visible"
                  }
                >
                  <div className="aura-history-title">
                    {group.label}
                  </div>

                  <div className="aura-history-list">
                    {group.items.map(
                      (
                        conversation
                      ) => {
                        const isEditing =
                          editingConversationId ===
                          conversation.id;

                        return (
                          <motion.div
                            key={
                              conversation.id
                            }
                            className={`aura-history-item ${
                              activeConversationId ===
                              conversation.id
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              openConversation(
                                conversation.id
                              )
                            }
                            role="button"
                            tabIndex={
                              0
                            }
                            variants={
                              reducedMotion
                                ? undefined
                                : listItem
                            }
                            whileHover={hoverProps(
                              {
                                x: 2,
                              }
                            )}
                            onKeyDown={(
                              event
                            ) => {
                              if (
                                event.key ===
                                  "Enter" ||
                                event.key ===
                                  " "
                              ) {
                                event.preventDefault();

                                openConversation(
                                  conversation.id
                                );
                              }
                            }}
                          >
                            {isEditing ? (
                              <input
                                autoFocus
                                className="aura-history-rename-input"
                                value={
                                  editingConversationTitle
                                }
                                onChange={(
                                  event
                                ) =>
                                  setEditingConversationTitle(
                                    event
                                      .target
                                      .value
                                  )
                                }
                                onKeyDown={(
                                  event
                                ) =>
                                  handleRenameKeyDown(
                                    event,
                                    conversation.id
                                  )
                                }
                                onBlur={() =>
                                  saveRenameConversation(
                                    conversation.id
                                  )
                                }
                                onClick={(
                                  event
                                ) =>
                                  event.stopPropagation()
                                }
                              />
                            ) : (
                              <>
                                <div className="aura-history-item-title">
                                  {
                                    conversation.title
                                  }
                                </div>

                                <div className="aura-history-item-actions">
                                  <motion.button
                                    type="button"
                                    className="aura-history-action"
                                    aria-label="Renomear conversa"
                                    onClick={(
                                      event
                                    ) =>
                                      startRenameConversation(
                                        event,
                                        conversation
                                      )
                                    }
                                    whileHover={hoverProps(
                                      {
                                        scale: 1.12,
                                      }
                                    )}
                                    whileTap={
                                      reducedMotion
                                        ? undefined
                                        : {
                                            scale: 0.9,
                                          }
                                    }
                                  >
                                    <Pencil
                                      size={
                                        14
                                      }
                                    />
                                  </motion.button>

                                  <motion.button
                                    type="button"
                                    className="aura-history-action"
                                    aria-label="Excluir conversa"
                                    onClick={(
                                      event
                                    ) =>
                                      deleteConversation(
                                        event,
                                        conversation.id
                                      )
                                    }
                                    whileHover={hoverProps(
                                      {
                                        scale: 1.12,
                                      }
                                    )}
                                    whileTap={
                                      reducedMotion
                                        ? undefined
                                        : {
                                            scale: 0.9,
                                          }
                                    }
                                  >
                                    <Trash2
                                      size={
                                        14
                                      }
                                    />
                                  </motion.button>
                                </div>
                              </>
                            )}
                          </motion.div>
                        );
                      }
                    )}
                  </div>
                </motion.div>
              )
            )}
          </motion.div>

          {                    }

          <motion.div
            className="aura-sidebar-bottom"
            initial={
              reducedMotion
                ? false
                : {
                    opacity: 0,
                    y: 10,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.35,
              duration: 0.5,
              ease: easePremium,
            }}
          >
            <motion.div
              className="aura-sidebar-user"
              whileHover={hoverProps({
                x: 2,
              })}
            >
              <div className="aura-sidebar-user-avatar">
                <Crown
                  size={14}
                  strokeWidth={2}
                />
              </div>

              <div className="aura-sidebar-user-info">
                <div className="aura-sidebar-user-name">
                  Plano Estudante
                </div>

                <div className="aura-sidebar-user-status">
                  EducaCube AURA
                </div>
              </div>
            </motion.div>

            <motion.div
              className="aura-sidebar-user"
              whileHover={hoverProps({
                x: 2,
              })}
            >
              <div className="aura-sidebar-user-avatar">
                <User
                  size={14}
                  strokeWidth={2}
                />
              </div>

              <div className="aura-sidebar-user-info">
                <div className="aura-sidebar-user-name">
                  Aluno(a)
                </div>

                <div className="aura-sidebar-user-status">
                  @educacube
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.aside>

        {                                                             
                
                                                                         }

        <main className="aura-main">

          {            }

          <motion.header
            className="aura-header"
            initial={
              reducedMotion
                ? false
                : {
                    opacity: 0,
                    y: -12,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.6,
              ease: easePremium,
            }}
          >
            <div className="aura-header-left">

              <motion.button
                type="button"
                className="aura-mobile-menu-button"
                onClick={() =>
                  setSidebarOpen(true)
                }
                aria-label="Abrir menu"
                aria-expanded={
                  sidebarOpen
                }
                aria-controls="aura-sidebar"
                whileHover={hoverProps({
                  scale: 1.08,
                })}
                whileTap={
                  reducedMotion
                    ? undefined
                    : {
                        scale: 0.9,
                      }
                }
              >
                <Menu size={18} />
              </motion.button>

              <motion.div
                className="aura-header-logo-slot"
                initial={
                  reducedMotion
                    ? false
                    : {
                        opacity: 0,
                        scale: 0.8,
                        filter:
                          "blur(6px)",
                      }
                }
                animate={{
                  opacity: 1,
                  scale: 1,
                  filter:
                    "blur(0px)",
                }}
                transition={{
                  delay: 0.15,
                  duration: 0.7,
                  ease: easePremium,
                }}
              >
                <img
                  src="/LogoIA.png"
                  alt="AURA"
                  className="aura-header-logo"
                />
              </motion.div>

              <div className="aura-header-title-group">
                <div className="aura-header-title">
                  AURA
                </div>

                <motion.div
                  className="aura-header-status"
                  key={auraState}
                  initial={
                    reducedMotion
                      ? false
                      : {
                          opacity: 0,
                          y: 3,
                        }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  transition={{
                    duration: 0.3,
                  }}
                >
                  <motion.span
                    className="aura-header-status-dot"
                    animate={
                      reducedMotion
                        ? undefined
                        : {
                            scale:
                              auraState ===
                                "thinking" ||
                              auraState ===
                                "generating"
                                ? [
                                    1,
                                    1.35,
                                    1,
                                  ]
                                : 1,
                            opacity:
                              auraState ===
                              "offline"
                                ? 0.35
                                : [
                                    0.65,
                                    1,
                                    0.65,
                                  ],
                          }
                    }
                    transition={
                      reducedMotion
                        ? undefined
                        : {
                            duration: 1.5,
                            repeat:
                              auraState ===
                              "offline"
                                ? 0
                                : Infinity,
                            ease:
                              "easeInOut",
                          }
                    }
                  />

                  <span>
                    {
                      AURA_STATE_LABELS[
                        auraState
                      ]
                    }
                  </span>
                </motion.div>
              </div>
            </div>

            <div>
              <motion.button
                type="button"
                className="aura-message-action"
                aria-label="Nova conversa"
                onClick={
                  startNewConversation
                }
                whileHover={hoverProps({
                  rotate: 90,
                  scale: 1.08,
                })}
                whileTap={
                  reducedMotion
                    ? undefined
                    : {
                        scale: 0.9,
                      }
                }
              >
                <Plus size={16} />
              </motion.button>
            </div>
          </motion.header>

          {          }

          <section className="aura-chat-section">
            {!hasConversation ? (
              <div className="aura-chat-scroll">
                <div className="aura-chat-content">
                  <motion.div
                    className="aura-welcome"
                    initial={
                      reducedMotion
                        ? false
                        : "hidden"
                    }
                    animate={
                      reducedMotion
                        ? undefined
                        : "visible"
                    }
                    variants={fadeUp}
                  >
                    <motion.div
                      className="aura-orb-slot"
                      initial={
                        reducedMotion
                          ? false
                          : {
                              opacity: 0,
                              scale: 0.72,
                              y: 12,
                              filter:
                                "blur(10px)",
                            }
                      }
                      animate={{
                        opacity: 1,
                        scale: 1,
                        y: 0,
                        filter:
                          "blur(0px)",
                      }}
                      transition={{
                        duration: 0.9,
                        delay: 0.05,
                        ease: easePremium,
                      }}
                    >
                      <NeuralOrb
                        state={
                          auraState
                        }
                        size={68}
                        audioLevel={
                          audioLevel
                        }
                      />
                    </motion.div>

                    <AnimatedWelcomeTitle
                      reducedMotion={
                        reducedMotion ??
                        false
                      }
                    />

                    <motion.p
                      className="aura-welcome-subtitle"
                      initial={
                        reducedMotion
                          ? false
                          : {
                              opacity: 0,
                              y: 12,
                              filter:
                                "blur(6px)",
                            }
                      }
                      animate={{
                        opacity: 1,
                        y: 0,
                        filter:
                          "blur(0px)",
                      }}
                      transition={{
                        delay: 0.75,
                        duration: 0.65,
                        ease: easePremium,
                      }}
                    >
                      Explique conceitos,
                      construa
                      exercícios,
                      estruture aulas
                      e organize
                      pesquisas — com a
                      profundidade que o
                      estudo pedagógico
                      exige.
                    </motion.p>

                    <motion.div
                      className="aura-suggestions"
                      variants={
                        listContainer
                      }
                      initial="hidden"
                      animate="visible"
                    >
                      {SUGGESTIONS.map(
                        (
                          suggestion
                        ) => {
                          const Icon =
                            suggestion.icon;

                          return (
                            <motion.button
                              key={
                                suggestion.id
                              }
                              type="button"
                              className="aura-suggestion"
                              variants={
                                listItem
                              }
                              onClick={() =>
                                sendMessage(
                                  suggestion.prompt
                                )
                              }
                              whileHover={hoverProps(
                                {
                                  y: -3,
                                  scale: 1.008,
                                }
                              )}
                              whileTap={
                                reducedMotion
                                  ? undefined
                                  : {
                                      scale: 0.985,
                                    }
                              }
                            >
                              <div className="aura-suggestion-title">
                                <Icon
                                  size={14}
                                  style={{
                                    display:
                                      "inline-block",
                                    marginRight: 7,
                                    verticalAlign:
                                      "middle",
                                  }}
                                />

                                {
                                  suggestion.label
                                }
                              </div>

                              <div className="aura-suggestion-description">
                                {
                                  suggestion.detail
                                }
                              </div>
                            </motion.button>
                          );
                        }
                      )}
                    </motion.div>
                  </motion.div>
                </div>
              </div>
            ) : (
              <div
                className="aura-chat-scroll"
                ref={scrollRef}
                onScroll={
                  handleMessagesScroll
                }
              >
                <div className="aura-chat-content">
                  <motion.div
                    className="aura-messages"
                    initial={
                      reducedMotion
                        ? false
                        : {
                            opacity: 0,
                          }
                    }
                    animate={{
                      opacity: 1,
                    }}
                    transition={{
                      duration: 0.4,
                    }}
                  >
                    <AnimatePresence
                      initial={false}
                    >
                      {messages.map(
                        (message) => {
                          if (
                            message.role ===
                            "user"
                          ) {
                            return (
                              <motion.div
                                key={
                                  message.id
                                }
                                className="aura-message user"
                                initial={
                                  reducedMotion
                                    ? false
                                    : {
                                        opacity: 0,
                                        y: 12,
                                        scale: 0.985,
                                      }
                                }
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                  scale: 1,
                                }}
                                transition={{
                                  duration: 0.5,
                                  ease: easePremium,
                                }}
                              >
                                <div className="aura-user-message">
                                  {
                                    message.content
                                  }
                                </div>
                              </motion.div>
                            );
                          }

                          if (
                            message.status ===
                            "error"
                          ) {
                            return (
                              <motion.div
                                key={
                                  message.id
                                }
                                className="aura-error"
                                initial={
                                  reducedMotion
                                    ? false
                                    : {
                                        opacity: 0,
                                        y: 8,
                                      }
                                }
                                animate={{
                                  opacity: 1,
                                  y: 0,
                                }}
                              >
                                <AlertTriangle
                                  size={15}
                                />

                                <span>
                                  Não
                                  consegui
                                  concluir
                                  essa
                                  resposta.
                                </span>

                                <button
                                  type="button"
                                  className="aura-message-action"
                                  onClick={
                                    retryLastMessage
                                  }
                                >
                                  Tentar
                                  novamente
                                </button>
                              </motion.div>
                            );
                          }

                          const isSpeaking =
                            speakingMessageId ===
                            message.id;

                          return (
                            <motion.div
                              key={
                                message.id
                              }
                              className="aura-message assistant"
                              initial={
                                reducedMotion
                                  ? false
                                  : {
                                      opacity: 0,
                                      y: 14,
                                      filter:
                                        "blur(5px)",
                                    }
                              }
                              animate={{
                                opacity: 1,
                                y: 0,
                                filter:
                                  "blur(0px)",
                              }}
                              transition={{
                                duration: 0.62,
                                ease: easePremium,
                              }}
                            >
                              <div className="aura-assistant-message">
                                <motion.div
                                  className="aura-assistant-avatar"
                                  initial={
                                    reducedMotion
                                      ? false
                                      : {
                                          opacity: 0,
                                          scale: 0.7,
                                        }
                                  }
                                  animate={{
                                    opacity: 1,
                                    scale: 1,
                                  }}
                                  transition={{
                                    duration: 0.5,
                                    ease: easePremium,
                                  }}
                                >
                                  <Box
                                    size={16}
                                    strokeWidth={
                                      1.7
                                    }
                                  />
                                </motion.div>

                                <div className="aura-assistant-content">
                                  <div className="aura-assistant-name">
                                    AURA
                                  </div>

                                  <div className="aura-markdown">
                                    {renderAuraMarkdown(
                                      message.content
                                    )}
                                  </div>

                                  <div className="aura-message-actions">
                                    <div className="aura-tooltip-trigger">
                                      <motion.button
                                        type="button"
                                        className="aura-message-action"
                                        onClick={() =>
                                          copyMessage(
                                            message
                                          )
                                        }
                                        aria-label="Copiar resposta"
                                        whileHover={hoverProps(
                                          {
                                            scale: 1.1,
                                          }
                                        )}
                                        whileTap={
                                          reducedMotion
                                            ? undefined
                                            : {
                                                scale: 0.88,
                                              }
                                        }
                                      >
                                        <Copy
                                          size={
                                            14
                                          }
                                        />
                                      </motion.button>

                                      {copiedMessageId ===
                                        message.id && (
                                        <motion.span
                                          className="aura-tooltip"
                                          initial={{
                                            opacity: 0,
                                            y: 4,
                                          }}
                                          animate={{
                                            opacity: 1,
                                            y: 0,
                                          }}
                                        >
                                          Copiado
                                        </motion.span>
                                      )}
                                    </div>

                                    <div className="aura-tooltip-trigger">
                                      <motion.button
                                        type="button"
                                        className="aura-message-action"
                                        onClick={() =>
                                          regenerate(
                                            message.id
                                          )
                                        }
                                        aria-label="Regenerar resposta"
                                        whileHover={hoverProps(
                                          {
                                            scale: 1.1,
                                            rotate:
                                              -8,
                                          }
                                        )}
                                        whileTap={
                                          reducedMotion
                                            ? undefined
                                            : {
                                                scale: 0.88,
                                              }
                                        }
                                      >
                                        <RotateCcw
                                          size={
                                            14
                                          }
                                        />
                                      </motion.button>

                                      <span className="aura-tooltip">
                                        Regenerar
                                      </span>
                                    </div>

                                    <div className="aura-tooltip-trigger">
                                      <motion.button
                                        type="button"
                                        className="aura-message-action"
                                        onClick={() =>
                                          toggleSpeak(
                                            message
                                          )
                                        }
                                        aria-label={
                                          isSpeaking
                                            ? "Parar áudio"
                                            : "Ouvir resposta"
                                        }
                                        whileHover={hoverProps(
                                          {
                                            scale: 1.1,
                                          }
                                        )}
                                        whileTap={
                                          reducedMotion
                                            ? undefined
                                            : {
                                                scale: 0.88,
                                              }
                                        }
                                      >
                                        {isSpeaking ? (
                                          <VolumeX
                                            size={
                                              14
                                            }
                                          />
                                        ) : (
                                          <Volume2
                                            size={
                                              14
                                            }
                                          />
                                        )}
                                      </motion.button>

                                      <span className="aura-tooltip">
                                        {isSpeaking
                                          ? "Parar"
                                          : "Ouvir"}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        }
                      )}
                    </AnimatePresence>

                    <AnimatePresence>
                      {isBusy && (
                        <motion.div
                          className="aura-thinking"
                          initial={
                            reducedMotion
                              ? false
                              : {
                                  opacity: 0,
                                  y: 10,
                                }
                          }
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={
                            reducedMotion
                              ? undefined
                              : {
                                  opacity: 0,
                                  y: -5,
                                }
                          }
                          transition={{
                            duration: 0.4,
                            ease: easePremium,
                          }}
                        >
                          <MorphingSquare
                            size={16}
                          />

                          <span>
                            {auraState ===
                            "generating"
                              ? "AURA está respondendo"
                              : "AURA está pensando"}
                          </span>

                          <span className="aura-thinking-dots">
                            {[0, 1, 2].map(
                              (index) => (
                                <motion.span
                                  key={
                                    index
                                  }
                                  className="aura-thinking-dot"
                                  animate={
                                    reducedMotion
                                      ? undefined
                                      : {
                                          y: [
                                            0,
                                            -4,
                                            0,
                                          ],
                                          opacity:
                                            [
                                              0.4,
                                              1,
                                              0.4,
                                            ],
                                        }
                                  }
                                  transition={
                                    reducedMotion
                                      ? undefined
                                      : {
                                          duration: 0.9,
                                          repeat:
                                            Infinity,
                                          delay:
                                            index *
                                            0.14,
                                          ease:
                                            "easeInOut",
                                        }
                                  }
                                />
                              )
                            )}
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>

                <AnimatePresence>
                  {showScrollToLatest && (
                    <motion.button
                      type="button"
                      className="aura-scroll-latest"
                      onClick={
                        scrollToLatest
                      }
                      initial={
                        reducedMotion
                          ? false
                          : {
                              opacity: 0,
                              y: 10,
                              scale: 0.94,
                            }
                      }
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: 1,
                      }}
                      exit={
                        reducedMotion
                          ? undefined
                          : {
                              opacity: 0,
                              y: 10,
                              scale: 0.94,
                            }
                      }
                      whileHover={hoverProps({
                        y: -2,
                      })}
                      whileTap={
                        reducedMotion
                          ? undefined
                          : {
                              scale: 0.96,
                            }
                      }
                    >
                      <ChevronDown
                        size={16}
                      />

                      <span>
                        Nova resposta
                      </span>
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            )}

            {              }

            <motion.div
              className="aura-composer-area"
              initial={
                reducedMotion
                  ? false
                  : {
                      opacity: 0,
                      y: 16,
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: 0.25,
                duration: 0.6,
                ease: easePremium,
              }}
            >
              <div className="aura-composer">
                <div className="aura-composer-box">
                  {attachments.length >
                    0 && (
                    <motion.div
                      className="aura-attachments"
                      initial={
                        reducedMotion
                          ? false
                          : {
                              opacity: 0,
                              height: 0,
                            }
                      }
                      animate={{
                        opacity: 1,
                        height: "auto",
                      }}
                    >
                      <AnimatePresence>
                        {attachments.map(
                          (file) => (
                            <motion.div
                              key={
                                file.id
                              }
                              className="aura-attachment-chip"
                              initial={
                                reducedMotion
                                  ? false
                                  : {
                                      opacity: 0,
                                      scale: 0.9,
                                      y: 5,
                                    }
                              }
                              animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                              }}
                              exit={
                                reducedMotion
                                  ? undefined
                                  : {
                                      opacity: 0,
                                      scale: 0.9,
                                    }
                              }
                            >
                              <Paperclip
                                size={14}
                              />

                              <span>
                                {
                                  file.name
                                }
                              </span>

                              <span>
                                {formatBytes(
                                  file.size
                                )}
                              </span>

                              <button
                                type="button"
                                className="aura-attachment-remove"
                                aria-label={`Remover ${file.name}`}
                                onClick={() =>
                                  removeAttachment(
                                    file.id
                                  )
                                }
                              >
                                <X
                                  size={12}
                                />
                              </button>
                            </motion.div>
                          )
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  <div
                    className="aura-input-wrapper"
                    data-dragover={
                      isDragOver
                    }
                    onDragOver={
                      handleDragOver
                    }
                    onDragLeave={
                      handleDragLeave
                    }
                    onDrop={
                      handleDrop
                    }
                  >
                    <AnimatePresence>
                      {isDragOver && (
                        <motion.div
                          className="aura-drop-overlay"
                          initial={
                            reducedMotion
                              ? false
                              : {
                                  opacity: 0,
                                  scale: 0.98,
                                }
                          }
                          animate={{
                            opacity: 1,
                            scale: 1,
                          }}
                          exit={
                            reducedMotion
                              ? undefined
                              : {
                                  opacity: 0,
                                }
                          }
                        >
                          <Paperclip
                            size={15}
                          />

                          <span>
                            Solte para anexar
                          </span>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <input
                      ref={
                        fileInputRef
                      }
                      type="file"
                      multiple
                      hidden
                      onChange={
                        handleFileInputChange
                      }
                    />

                    <div className="aura-tooltip-trigger">
                      <motion.button
                        type="button"
                        className="aura-composer-button"
                        aria-label="Anexar arquivo"
                        onClick={() =>
                          fileInputRef.current?.click()
                        }
                        whileHover={hoverProps(
                          {
                            scale: 1.08,
                            y: -1,
                          }
                        )}
                        whileTap={
                          reducedMotion
                            ? undefined
                            : {
                                scale: 0.9,
                              }
                        }
                      >
                        <Paperclip
                          size={17}
                        />
                      </motion.button>

                      <span className="aura-tooltip">
                        Anexar arquivo
                      </span>
                    </div>

                    <textarea
                      ref={
                        textareaRef
                      }
                      value={input}
                      onChange={(
                        event
                      ) =>
                        setInput(
                          event.target
                            .value
                        )
                      }
                      onKeyDown={
                        handleKeyDown
                      }
                      placeholder={
                        isOnline
                          ? "Pergunte, peça um resumo ou uma sequência didática..."
                          : "Sem conexão no momento..."
                      }
                      rows={1}
                      maxLength={6000}
                      className="aura-textarea"
                      disabled={
                        !isOnline
                      }
                    />

                    <div className="aura-tooltip-trigger">
                      <motion.button
                        type="button"
                        className={`aura-microphone-button ${
                          micActive
                            ? "active"
                            : ""
                        }`}
                        aria-label={
                          micActive
                            ? "Parar escuta"
                            : "Falar com a AURA"
                        }
                        onClick={
                          toggleMic
                        }
                        whileHover={hoverProps(
                          {
                            scale: 1.08,
                          }
                        )}
                        whileTap={
                          reducedMotion
                            ? undefined
                            : {
                                scale: 0.9,
                              }
                        }
                      >
                        <Mic size={17} />
                      </motion.button>

                      <span className="aura-tooltip">
                        {micActive
                          ? "Parar escuta"
                          : "Falar com a AURA"}
                      </span>
                    </div>

                    <AnimatePresence mode="wait">
                      {isBusy ? (
                        <motion.button
                          key="stop"
                          type="button"
                          className="aura-send-button"
                          data-mode="stop"
                          aria-label="Parar geração"
                          onClick={
                            handleStopGenerating
                          }
                          initial={
                            reducedMotion
                              ? false
                              : {
                                  opacity: 0,
                                  scale: 0.75,
                                  rotate: -20,
                                }
                          }
                          animate={{
                            opacity: 1,
                            scale: 1,
                            rotate: 0,
                          }}
                          exit={
                            reducedMotion
                              ? undefined
                              : {
                                  opacity: 0,
                                  scale: 0.75,
                                  rotate: 20,
                                }
                          }
                          whileHover={hoverProps(
                            {
                              scale: 1.06,
                            }
                          )}
                          whileTap={
                            reducedMotion
                              ? undefined
                              : {
                                  scale: 0.9,
                                }
                          }
                        >
                          <Square
                            size={13}
                            fill="currentColor"
                          />
                        </motion.button>
                      ) : (
                        <motion.button
                          key="send"
                          type="button"
                          className="aura-send-button"
                          aria-label="Enviar mensagem"
                          disabled={
                            !input.trim() ||
                            !isOnline
                          }
                          onClick={() =>
                            sendMessage(
                              input
                            )
                          }
                          initial={
                            reducedMotion
                              ? false
                              : {
                                  opacity: 0,
                                  scale: 0.75,
                                }
                          }
                          animate={{
                            opacity: 1,
                            scale: 1,
                          }}
                          exit={
                            reducedMotion
                              ? undefined
                              : {
                                  opacity: 0,
                                  scale: 0.75,
                                }
                          }
                          whileHover={hoverProps(
                            {
                              scale: 1.07,
                              y: -1,
                            }
                          )}
                          whileTap={
                            reducedMotion
                              ? undefined
                              : {
                                  scale: 0.9,
                                }
                          }
                        >
                          <Send size={16} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                <div className="aura-composer-meta">
                  {isOnline ? (
                    <>
                      <span className="aura-composer-hint">
                        {isTouch
                          ? "Toque em enviar · Enter cria nova linha"
                          : "Enter para enviar · Shift + Enter para nova linha"}
                      </span>

                      <span className="aura-composer-model">
                        AURA IA · EDUCACUBE
                      </span>
                    </>
                  ) : (
                    <span className="aura-composer-hint">
                      <WifiOff
                        size={11}
                        style={{
                          display:
                            "inline",
                          marginRight: 5,
                        }}
                      />

                      Sem conexão
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </section>
        </main>
      </div>
    </div>
  );
}
