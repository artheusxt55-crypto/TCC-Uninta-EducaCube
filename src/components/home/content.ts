







import type { ComponentType } from "react";

import {
    IconAprendizagem,
    IconAura,
    IconBiblioteca,
    IconBncc,
    IconDiagnostico,
    IconIntervencao,
    IconMapa,
    IconPlanejamento,
} from "./icons";





export type ModuleId =
    | "diagnostico"
    | "bncc"
    | "planejamento"
    | "intervencao";

export type IconComponent = ComponentType<{ className?: string }>;


export type Action =
    | { kind: "module"; id: ModuleId; label: string }
    | { kind: "link"; href: string; label: string };





export const ROUTES = {
    login: "/login",
    aura: "/aura",
    biblioteca: "/biblioteca.html",
    atlas: "/atlas.html",
    privacidade: "/privacidade.html",
    cookies: "/cookies.html",
} as const;





export type Stage = {
    id: string;
    
    noun: string;
    
    verb: string;
    summary: string;
    detail: string;
    actions: Action[];
};

export const STAGES: Stage[] = [
    {
        id: "diagnostico",
        noun: "Diagnóstico",
        verb: "Diagnosticar",
        summary:
            "Compreender necessidades, contexto e aprendizagem.",
        detail:
            "Tudo começa pela observação: o que a turma ou o estudante já domina e onde encontra dificuldade.",
        actions: [
            {
                kind: "module",
                id: "diagnostico",
                label: "Abrir o Diagnóstico",
            },
        ],
    },
    {
        id: "planejamento",
        noun: "Planejamento",
        verb: "Planejar",
        summary:
            "Estruturar objetivos, estratégias e ações pedagógicas.",
        detail:
            "A necessidade observada vira um plano, com tema, série e um objetivo claro para o que o aluno deve desenvolver.",
        actions: [
            {
                kind: "module",
                id: "planejamento",
                label: "Abrir o Planejamento",
            },
        ],
    },
    {
        id: "conhecimento",
        noun: "Conhecimento",
        verb: "Fundamentar",
        summary:
            "Consultar conhecimentos, referências e documentos relevantes.",
        detail:
            "O plano se apoia na base curricular e na biblioteca, para que cada escolha tenha fundamento.",
        actions: [
            {
                kind: "module",
                id: "bncc",
                label: "Consultar a BNCC",
            },
            {
                kind: "link",
                href: ROUTES.biblioteca,
                label: "Biblioteca digital",
            },
        ],
    },
    {
        id: "intervencao",
        noun: "Intervenção",
        verb: "Intervir",
        summary:
            "Transformar o planejamento em prática pedagógica.",
        detail:
            "Da necessidade identificada e do contexto da turma surgem estratégias dirigidas para a sala de aula.",
        actions: [
            {
                kind: "module",
                id: "intervencao",
                label: "Abrir a Intervenção",
            },
        ],
    },
    {
        id: "aprendizagem",
        noun: "Aprendizagem",
        verb: "Acompanhar",
        summary:
            "Organizar e revisar o processo de aprendizagem.",
        detail:
            "O ciclo recomeça: o que aconteceu na prática alimenta um novo diagnóstico.",
        actions: [
            {
                kind: "link",
                href: ROUTES.atlas,
                label: "Mapa da aprendizagem",
            },
        ],
    },
];





export const AUDIENCE = [
    {
        title: "Professores da educação básica",
        text: "Quem diagnostica, planeja e intervém na aprendizagem todos os dias, dentro da sala de aula.",
    },
    {
        title: "Estudantes da formação docente",
        text: "Quem está aprendendo a exercer a docência e precisa de um espaço de estudo, consulta e prática.",
    },
] as const;





export const PROBLEMS = [
    {
        problem: "Informações pedagógicas dispersas",
        answer: "Diagnóstico, planejamento e referências ficam no mesmo ambiente, com a mesma linguagem.",
    },
    {
        problem: "Planejar sem uma estrutura clara",
        answer: "O planejamento parte de tema, série e objetivo e organiza estratégias e ações em um roteiro.",
    },
    {
        problem: "Referências difíceis de localizar na hora de decidir",
        answer: "A BNCC e a biblioteca digital ficam a um clique do plano, sem trocar de ferramenta.",
    },
    {
        problem: "Intervenções improvisadas",
        answer: "A intervenção é desenhada a partir da necessidade identificada e do contexto da turma.",
    },
    {
        problem: "Diagnóstico desligado do planejamento",
        answer: "O que foi observado segue para a etapa seguinte, em vez de ficar em anotações soltas.",
    },
    {
        problem: "Recursos espalhados em vários lugares",
        answer: "Um único ponto de entrada reúne módulos, biblioteca, mapa da aprendizagem e AURA.",
    },
] as const;





export type ModuleEntry = {
    id: ModuleId;
    numero: string;
    nome: string;
    etapa: string;
    descricao: string;
    funcao: string;
    Icone: IconComponent;
};


export const MODULES: ModuleEntry[] = [
    {
        id: "diagnostico",
        numero: "01",
        nome: "Diagnóstico",
        etapa: "Diagnosticar",
        descricao: "Leitura do processo de aprendizagem.",
        funcao: "Ponto de partida do ciclo: descreve a necessidade observada em uma turma ou estudante.",
        Icone: IconDiagnostico,
    },
    {
        id: "bncc",
        numero: "02",
        nome: "BNCC",
        etapa: "Fundamentar",
        descricao: "Consulta à base curricular.",
        funcao: "Fundamento do plano: liga o trabalho pedagógico às habilidades da base curricular.",
        Icone: IconBncc,
    },
    {
        id: "planejamento",
        numero: "03",
        nome: "Planejamento",
        etapa: "Planejar",
        descricao: "Construção de planos de aula.",
        funcao: "Organiza tema, série e objetivo em um plano que a prática possa seguir.",
        Icone: IconPlanejamento,
    },
    {
        id: "intervencao",
        numero: "04",
        nome: "Intervenção",
        etapa: "Intervir",
        descricao: "Estratégias pedagógicas dirigidas.",
        funcao: "Parte da necessidade e do contexto para propor ações dirigidas à turma.",
        Icone: IconIntervencao,
    },
];

export type SupportEntry = {
    nome: string;
    etapa: string;
    descricao: string;
    funcao: string;
    href: string;
    cta: string;
    Icone: IconComponent;
};


export const SUPPORT_RESOURCES: SupportEntry[] = [
    {
        nome: "Biblioteca digital",
        etapa: "Fundamentar",
        descricao: "Referências e documentos para consulta.",
        funcao: "Reúne o material de estudo que sustenta o planejamento.",
        href: ROUTES.biblioteca,
        cta: "Abrir a biblioteca",
        Icone: IconBiblioteca,
    },
    {
        nome: "Mapa da aprendizagem",
        etapa: "Acompanhar",
        descricao: "O percurso de aprendizagem em forma de mapa.",
        funcao: "Ajuda a acompanhar e revisar o processo depois da intervenção.",
        href: ROUTES.atlas,
        cta: "Explorar o mapa",
        Icone: IconMapa,
    },
    {
        nome: "AURA AI",
        etapa: "Todo o percurso",
        descricao: "Ferramenta pedagógica de inteligência artificial.",
        funcao: "Apoia o professor em cada etapa, sem substituir sua decisão.",
        href: ROUTES.aura,
        cta: "Conhecer a AURA",
        Icone: IconAura,
    },
];





export const AURA_HELPS = [
    "Organizar o que foi observado na turma.",
    "Levantar caminhos para o planejamento.",
    "Estruturar propostas de intervenção.",
] as const;

export const TEACHER_DECIDES = [
    "Decide o que fazer com cada turma e cada estudante.",
    "Avalia o que é adequado ao contexto.",
    "Conduz a prática dentro da sala de aula.",
] as const;





export const EQUATION_TERMS = [
    {
        term: "BNCC",
        text: "A base curricular que orienta habilidades e competências.",
    },
    {
        term: "Referências",
        text: "Documentos e autores que sustentam as escolhas.",
    },
    {
        term: "Conhecimento",
        text: "O saber pedagógico organizado para consulta.",
    },
    {
        term: "Planejamento",
        text: "Objetivos, estratégias e ações em um roteiro.",
    },
] as const;





export type EcoNode = {
    nome: string;
    papel: string;
    action: Action;
    Icone: IconComponent;
};


export const ECO_NODES: EcoNode[] = [
    {
        nome: "Diagnóstico",
        papel: "Diagnosticar",
        action: { kind: "module", id: "diagnostico", label: "Abrir o Diagnóstico" },
        Icone: IconDiagnostico,
    },
    {
        nome: "Planejamento",
        papel: "Planejar",
        action: { kind: "module", id: "planejamento", label: "Abrir o Planejamento" },
        Icone: IconPlanejamento,
    },
    {
        nome: "BNCC",
        papel: "Fundamentar",
        action: { kind: "module", id: "bncc", label: "Consultar a BNCC" },
        Icone: IconBncc,
    },
    {
        nome: "Biblioteca",
        papel: "Fundamentar",
        action: { kind: "link", href: ROUTES.biblioteca, label: "Abrir a biblioteca" },
        Icone: IconBiblioteca,
    },
    {
        nome: "AURA",
        papel: "Apoiar",
        action: { kind: "link", href: ROUTES.aura, label: "Conhecer a AURA" },
        Icone: IconAura,
    },
    {
        nome: "Intervenção",
        papel: "Intervir",
        action: { kind: "module", id: "intervencao", label: "Abrir a Intervenção" },
        Icone: IconIntervencao,
    },
    {
        nome: "Aprendizagem",
        papel: "Acompanhar",
        action: { kind: "link", href: ROUTES.atlas, label: "Explorar o mapa da aprendizagem" },
        Icone: IconAprendizagem,
    },
];
