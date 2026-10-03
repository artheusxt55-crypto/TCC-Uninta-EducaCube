


export type Status =
  | 'ready'
  | 'loading'
  | 'error';

export interface Item {
  id: string;
  title: string;
  sub: string;
  color: string;
  pct?: number;
  pill?: string;
  icon?: string;
  hora?: string;
  time?: string;
  quando?: string;
}

export const fetchDashboard = <T>(
  data: T,
  ms = 500,
): Promise<T> =>
  new Promise((resolve) =>
    setTimeout(() => resolve(data), ms),
  );





export const alunoMock = {
  nome: 'João',

  kpis: [
    {
      label: 'Minhas aulas hoje',
      value: '3',
      sub: '/ 5',
      of: '/ 5',
      icon: '📖',
    },
    {
      label: 'Tarefas pendentes',
      value: '3',
      sub: '/ 7',
      of: '/ 7',
      icon: '✔',
    },
    {
      label: 'Meu progresso geral',
      value: '72%',
      sub: '+8% este mês',
      pct: 72,
      icon: '★',
    },
    {
      label: 'Horas de estudo',
      value: '14h',
      sub: '↑ 12%',
      trend: '↑ 12%',
      icon: '◔',
    },
  ],

  desempenho: {
    media: 72,

    acima: [18, 75] as [number, number],

    mediaQtd: [9, 18] as [number, number],

    abaixo: [3, 7] as [number, number],

    evolucao: [48, 57, 64, 68, 72],
  },

  disciplinas: [
    {
      id: 'm',
      title: 'Matemática',
      sub: '3 de 4 aulas concluídas',
      color: '#6d3df0',
      pct: 75,
      icon: 'π',
    },
    {
      id: 'p',
      title: 'Português',
      sub: '2 de 4 aulas concluídas',
      color: '#d0409a',
      pct: 50,
      icon: '✉',
    },
    {
      id: 'i',
      title: 'Inglês',
      sub: '1 de 4 aulas concluídas',
      color: '#12a58c',
      pct: 25,
      icon: '💬',
    },
    {
      id: 'h',
      title: 'História',
      sub: '3 de 4 aulas concluídas',
      color: '#e8a21a',
      pct: 75,
      icon: '🏛',
    },
  ] as Item[],

  aulas: [
    {
      id: '1',
      title: 'Matemática',
      sub: 'Hoje • 14:00',
      color: '#6d3df0',
      pill: 'Ao vivo',
      icon: '▶',
    },
    {
      id: '2',
      title: 'Inglês',
      sub: 'Hoje • 16:00',
      color: '#12a58c',
      pill: 'Agendada',
      icon: '💬',
    },
    {
      id: '3',
      title: 'História',
      sub: 'Amanhã • 09:00',
      color: '#e8a21a',
      pill: 'Agendada',
      icon: '🏛',
    },
    {
      id: '4',
      title: 'Português',
      sub: 'Amanhã • 14:00',
      color: '#d0409a',
      pill: 'Agendada',
      icon: '✉',
    },
  ] as Item[],

  
  hoje: [
    {
      id: '1',
      title: 'Matemática',
      sub: 'Hoje • 14:00',
      color: '#6d3df0',
      pill: 'Ao vivo',
      icon: '▶',
    },
    {
      id: '2',
      title: 'Inglês',
      sub: 'Hoje • 16:00',
      color: '#12a58c',
      pill: 'Agendada',
      icon: '💬',
    },
  ] as Item[],

  tarefas: [
    {
      id: 't1',
      title: 'Exercícios de Matemática - Capítulo 3',
      sub: 'Entrega: Hoje • 23:59',
      color: '#6d3df0',
      pill: 'Em andamento',
    },
    {
      id: 't2',
      title: 'Resumo de História - Era Vargas',
      sub: 'Entrega: Amanhã • 18:00',
      color: '#d0409a',
      pill: 'Pendente',
    },
    {
      id: 't3',
      title: 'Leitura em Inglês - Unit 2',
      sub: 'Entrega: Quinta • 23:59',
      color: '#12a58c',
      pill: 'Pendente',
    },
  ] as Item[],

  proximas: [
    {
      id: 't1',
      title: 'Exercícios de Matemática - Capítulo 3',
      sub: 'Entrega: Hoje • 23:59',
      color: '#6d3df0',
      pill: 'Em andamento',
    },
    {
      id: 't2',
      title: 'Resumo de História - Era Vargas',
      sub: 'Entrega: Amanhã • 18:00',
      color: '#d0409a',
      pill: 'Pendente',
    },
    {
      id: 't3',
      title: 'Leitura em Inglês - Unit 2',
      sub: 'Entrega: Quinta • 23:59',
      color: '#12a58c',
      pill: 'Pendente',
    },
  ] as Item[],

  ferramentas: [
    {
      t: 'Minhas disciplinas',
      s: 'Acessar conteúdos',
    },
    {
      t: 'Minhas atividades',
      s: 'Tarefas e exercícios',
    },
    {
      t: 'Aura IA',
      s: 'Assistente de estudos',
    },
    {
      t: 'Biblioteca',
      s: 'Materiais de estudo',
    },
    {
      t: 'Meu progresso',
      s: 'Acompanhar evolução',
    },
  ],

  entregas: [
    {
      id: 'e1',
      title: 'Matemática - Capítulo 3',
      sub: 'Exercícios enviados',
      color: '#6d3df0',
      pill: 'Concluído',
      hora: 'Hoje',
    },
    {
      id: 'e2',
      title: 'Inglês - Unit 2',
      sub: 'Atividade de leitura',
      color: '#12a58c',
      pill: 'Concluído',
      hora: 'Ontem',
    },
    {
      id: 'e3',
      title: 'História - Era Vargas',
      sub: 'Resumo solicitado',
      color: '#d0409a',
      pill: 'Pendente',
      hora: 'Amanhã',
    },
  ] as Item[],

  metas: {
    titulo: 'Metas de estudo',
    sub: 'Estudar 1h por dia',
    pct: 60,
  },

  projetos: [
    {
      id: 'pj1',
      title: 'Feira de Ciências - Energia Solar',
      sub: 'Em grupo • 3 colegas',
      color: '#12a58c',
      pct: 40,
      icon: '🔬',
    },
    {
      id: 'pj2',
      title: 'Projeto de Leitura - Clássicos',
      sub: 'Individual',
      color: '#d0409a',
      pct: 70,
      icon: '📚',
    },
  ] as Item[],

  materiais: [
    {
      id: 'mt1',
      title: 'Lista de exercícios - Funções',
      sub: 'Matemática • PDF',
      color: '#6d3df0',
      icon: '📄',
    },
    {
      id: 'mt2',
      title: 'Slides - Era Vargas',
      sub: 'História • Slides',
      color: '#e8a21a',
      icon: '📄',
    },
  ] as Item[],
};





export const professorMock = {
  kpis: [
    {
      label: 'Total de alunos',
      value: '48',
      sub: '+2 este mês',
      icon: '👥',
    },
    {
      label: 'Turmas ativas',
      value: '5',
      sub: 'Todas em andamento',
      icon: '👥',
    },
    {
      label: 'Avaliações aplicadas',
      value: '12',
      sub: '+3 esta semana',
      icon: '☑',
    },
    {
      label: 'Atividades entregues',
      value: '36',
      sub: '+8 esta semana',
      icon: '☑',
    },
  ],

  turmas: [
    {
      id: 'a',
      title: '7º ano - Matemática',
      sub: '32 alunos',
      color: '#6d3df0',
      pct: 88,
      icon: 'π',
    },
    {
      id: 'b',
      title: '8º ano - Inglês',
      sub: '28 alunos',
      color: '#2f6df0',
      pct: 76,
      icon: '💬',
    },
    {
      id: 'c',
      title: '9º ano - Ciências',
      sub: '26 alunos',
      color: '#12a58c',
      pct: 69,
      icon: '⚗',
    },
    {
      id: 'd',
      title: '1º ano - História',
      sub: '22 alunos',
      color: '#e8a21a',
      pct: 82,
      icon: '🏛',
    },
    {
      id: 'e',
      title: '2º ano - Português',
      sub: '18 alunos',
      color: '#d0409a',
      pct: 61,
      icon: '✉',
    },
  ] as Item[],

  desempenho: {
    media: 82,
    aprovados: [39, 81] as [number, number],
    recuperacao: [7, 15] as [number, number],
    abaixo: [2, 4] as [number, number],
    evolucao: [30, 55, 72, 68, 90],
  },

  ferramentas: [
    {
      t: 'Criar avaliação',
      s: 'Provas e simulados',
    },
    {
      t: 'Criar atividade',
      s: 'Exercícios e tarefas',
    },
    {
      t: 'Usar Aura IA',
      s: 'Assistente de planejamento',
    },
    {
      t: 'Importar conteúdo',
      s: 'PDF, links, arquivos',
    },
    {
      t: 'Biblioteca de recursos',
      s: 'Conteúdos prontos',
    },
  ],

  entregas: [
    {
      id: 'e1',
      title: 'João Pedro - 7º ano',
      sub: 'Atividade de Matemática',
      color: '#6d3df0',
      pill: 'Entregue',
      icon: '🧑',
    },
    {
      id: 'e2',
      title: 'Ana Clara - 8º ano',
      sub: 'Redação em Inglês',
      color: '#2f6df0',
      pill: 'Entregue',
      icon: '👩',
    },
    {
      id: 'e3',
      title: 'Lucas Gabriel - 9º ano',
      sub: 'Exercícios de Ciências',
      color: '#12a58c',
      pill: 'Entregue',
      icon: '🧒',
    },
  ] as Item[],

  hoje: [
    {
      id: 'h1',
      title: 'Matemática - 7º ano',
      sub: 'Aula 14:00 - 15:00',
      color: '#d0409a',
      pill: 'Em andamento',
    },
    {
      id: 'h2',
      title: 'Inglês - 8º ano',
      sub: 'Aula 16:00 - 17:00',
      color: '#12a58c',
      pill: 'Próxima',
    },
    {
      id: 'h3',
      title: 'Reunião pedagógica',
      sub: '19:00 - 20:00',
      color: '#d0409a',
      pill: 'Agendada',
    },
  ] as Item[],

  proximas: [
    {
      id: 'p1',
      title: 'Trabalho - Matemática',
      sub: 'Entrega: 23/09 - 23:59',
      color: '#6d3df0',
      pill: 'Pendente',
    },
    {
      id: 'p2',
      title: 'Redação - Inglês',
      sub: 'Entrega: 24/09 - 23:59',
      color: '#6d3df0',
      pill: 'Pendente',
    },
    {
      id: 'p3',
      title: 'Prova - História',
      sub: 'Aplicação: 26/09 - 14:00',
      color: '#6d3df0',
      pill: 'Agendada',
    },
  ] as Item[],

  projetos: [
    {
      id: 'pp1',
      title: 'Feira de Ciências - Orientação',
      sub: '7º ano • 6 grupos',
      color: '#12a58c',
      pct: 55,
      icon: '🔬',
    },
    {
      id: 'pp2',
      title: 'Clube de Leitura',
      sub: '2º ano • Mensal',
      color: '#d0409a',
      pct: 30,
      icon: '📚',
    },
  ] as Item[],

  planejamentos: [
    {
      id: 'pl1',
      title: 'Plano de aula - Funções do 1º grau',
      sub: '7º ano - Matemática',
      color: '#6d3df0',
      icon: '🗒',
    },
    {
      id: 'pl2',
      title: 'Sequência didática - Era Vargas',
      sub: '1º ano - História',
      color: '#e8a21a',
      icon: '🗒',
    },
  ] as Item[],

  arquivos: [
    {
      id: 'ar1',
      title: 'Prova - 1º Bimestre.pdf',
      sub: 'Atualizado ontem',
      color: '#6d3df0',
      icon: '📄',
    },
    {
      id: 'ar2',
      title: 'Planilha de notas - 8º ano.xlsx',
      sub: 'Atualizado há 2 dias',
      color: '#12a58c',
      icon: '📄',
    },
  ] as Item[],
};
