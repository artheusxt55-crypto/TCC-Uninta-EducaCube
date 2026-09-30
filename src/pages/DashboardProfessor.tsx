
import {
  useState,
  type CSSProperties,
  type ReactNode,
  type ComponentProps,
} from 'react';

import { StateBox } from '../components/dashboard/shared';

import {
  EcShell,
  EcCard,
  EcHero,
  EcCalendar,
  Pill,
  Icon,
  dataExtenso,
  useLoggedUser,
  useMockData,
  type EcNavItem,
  type EcItem,
  type IconName,
} from '../components/dashboard/ecShared';

import { professorMock } from '../components/mocks/dashboardMocks';

const A = '/assets/dashboard';

/* =========================================================
   NAVEGAÇÃO
========================================================= */

const nav: EcNavItem[] = [
  {
    label: 'Dashboard',
    icon: 'home',
    to: '/app/dashboard/professor',
  },
  {
    label: 'Turmas',
    icon: 'users',
    to: '/app/dashboard/professor/turmas',
  },
  {
    label: 'Meus Alunos',
    icon: 'user',
    to: '/app/dashboard/professor/alunos',
  },
  {
    label: 'Conteúdos',
    icon: 'book',
    to: '/app/dashboard/professor/conteudos',
  },
  {
    label: 'Avaliações',
    icon: 'editsq',
    to: '/app/dashboard/professor/avaliacoes',
  },
  {
    label: 'Atividades',
    icon: 'file',
    to: '/app/dashboard/professor/atividades',
  },
  {
    label: 'Correções',
    icon: 'checksq',
    to: '/app/dashboard/professor/correcoes',
  },
  {
    label: 'Biblioteca',
    icon: 'tasks',
    to: '/app/dashboard/professor/biblioteca',
  },
  {
    label: 'IA - Aura',
    icon: 'spark',
    to: '/app/dashboard/professor/aura',
  },
  {
    label: 'Relatórios',
    icon: 'chart',
    to: '/app/dashboard/professor/relatorios',
  },
  {
    label: 'Calendário',
    icon: 'cal',
    to: '/app/dashboard/professor/calendario',
  },
  {
    label: 'Configurações',
    icon: 'gear',
    to: '/app/dashboard/professor/configuracoes',
  },
];

/* =========================================================
   CONSTANTES VISUAIS
========================================================= */

const KPI_ICONS: IconName[] = [
  'users',
  'users',
  'editsq',
  'checksq',
];

const TOOL_ICONS: IconName[] = [
  'editsq',
  'checksq',
  'spark',
  'upload',
  'book',
];

const TURMA_COLORS = [
  '#6d28f9',
  '#1f6be8',
  '#12a97a',
  '#f0a01c',
  '#d0289f',
];

const HOJE_COLORS = [
  '#c0269f',
  '#12a394',
  '#c0269f',
];

const ATIV_COLORS = [
  '#c0269f',
  '#c0269f',
  '#4b1fc7',
];

const AVATARS = [
  `${A}/prof-av1.png`,
  `${A}/prof-av2.png`,
  `${A}/prof-av3.png`,
];

const TABS = [
  'Visão geral',
  'Por turma',
  'Por matéria',
];

/* =========================================================
   HELPERS
========================================================= */

const slug = (value = '') =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f\s]/g, '')
    .toLowerCase();

function turmaIcon(title: string): IconName {
  const value = slug(title);

  if (value.includes('matem')) {
    return 'pi';
  }

  if (value.includes('ingl')) {
    return 'lang';
  }

  if (value.includes('cienc')) {
    return 'flask';
  }

  if (value.includes('hist')) {
    return 'bank';
  }

  return 'editsq';
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string'
    ? value
    : undefined;
}

/* =========================================================
   GATE DE ESTADO
========================================================= */

function Gate(props: {
  status: string;
  items?: readonly unknown[];
  empty: string;
  emptyText: string;
  retry: () => void;
  children: ReactNode;
}) {
  const {
    status,
    items,
    empty,
    emptyText,
    retry,
    children,
  } = props;

  if (status !== 'ready' || !items?.length) {
    return (
      <StateBox
        status={
          (status === 'ready' ? 'empty' : status) as ComponentProps<
            typeof StateBox
          >['status']
        }
        empty={empty}
        emptyText={emptyText}
        onRetry={retry}
      />
    );
  }

  return <>{children}</>;
}

/* =========================================================
   DASHBOARD PROFESSOR
========================================================= */

export default function DashboardProfessor() {
  const {
    status,
    data,
    retry,
  } = useMockData(professorMock);

  const d = data ?? professorMock;

  const {
    full,
  } = useLoggedUser('João Silva');

  const [
    tab,
    setTab,
  ] = useState(0);

  /* =======================================================
     DESEMPENHO
  ======================================================= */

  const des = d.desempenho;

  const media = des.media;
  const evo = des.evolucao;

  const yOf = (value: number) =>
    Math.min(
      100,
      Math.max(
        0,
        100 - ((value - 20) / 80) * 100,
      ),
    );

  const xOf = (index: number) =>
    evo.length > 1
      ? (index / (evo.length - 1)) * 100
      : 0;

  const line = evo
    .map(
      (value, index) =>
        `${xOf(index)},${yOf(value)}`,
    )
    .join(' ');

  const legend = [
    {
      c: '#12c192',
      t: 'Aprovados',
      v: des.aprovados,
    },
    {
      c: '#f0a01c',
      t: 'Em recuperação',
      v: des.recuperacao,
    },
    {
      c: '#ef3b4a',
      t: 'Abaixo da média',
      v: des.abaixo,
    },
  ];

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <EcShell
      pageClass="dsh-prof"
      nav={nav}
      active="Dashboard"
      role="Professor"
      userName={
        /^prof/i.test(full)
          ? full
          : `Prof. ${full}`
      }
      searchPlaceholder="Buscar alunos, turmas, conteúdos, avaliações..."
      themeToggle
      mascotImg={`${A}/prof-owl-sidebar.png`}
      footerLogo={`${A}/prof-logo-outline.png`}
      mascotText={
        <>
          Juntos por
          <br />
          uma educação
          <br />
          mais inteligente.
        </>
      }
      aside={
        <>
          {/* ===============================================
              HOJE
          =============================================== */}

          <EcCard className="ec-hoje">
            <div className="ec-hoje-h">
              <h2>Hoje</h2>

              <small>
                {dataExtenso()}
              </small>

              <Icon
                name="cal"
                size={20}
              />
            </div>

            <Gate
              status={status}
              items={d.hoje}
              empty="Nada na agenda hoje"
              emptyText="Seus compromissos do dia aparecem aqui."
              retry={retry}
            >
              <div className="ec-acc-list">
                {(
                  d.hoje as unknown as EcItem[]
                ).map((item, index) => (
                  <a
                    key={
                      item.id ?? index
                    }
                    href="#"
                    className="ec-acc"
                    style={
                      {
                        '--c':
                          HOJE_COLORS[
                            index %
                              HOJE_COLORS.length
                          ],
                      } as CSSProperties
                    }
                  >
                    <span className="ec-tile sm">
                      <Icon
                        name={
                          index === 1
                            ? 'lang'
                            : 'editsq'
                        }
                        size={18}
                      />
                    </span>

                    <div className="ec-rb">
                      <b>
                        {item.title}
                      </b>

                      <small>
                        {item.sub}
                      </small>
                    </div>

                    <Pill
                      text={item.pill}
                    />
                  </a>
                ))}
              </div>
            </Gate>
          </EcCard>

          {/* ===============================================
              CALENDÁRIO
          =============================================== */}

          <EcCalendar
            title="Calendário de aulas e atividades"
            link={false}
          />

          {/* ===============================================
              PRÓXIMAS ATIVIDADES
          =============================================== */}

          <EcCard
            title="Próximas atividades"
            link="Ver todas"
            href="/app/dashboard/professor/atividades"
          >
            <Gate
              status={status}
              items={d.proximas}
              empty="Nenhuma atividade"
              emptyText="Crie uma atividade para vê-la aqui."
              retry={retry}
            >
              <div className="ec-acc-list flat">
                {(
                  d.proximas as unknown as EcItem[]
                ).map((item, index) => (
                  <a
                    key={
                      item.id ?? index
                    }
                    href="#"
                    className="ec-acc"
                    style={
                      {
                        '--c':
                          ATIV_COLORS[
                            index %
                              ATIV_COLORS.length
                          ],
                      } as CSSProperties
                    }
                  >
                    <span
                      className="ec-tile sm"
                      style={{
                        background:
                          ATIV_COLORS[
                            index %
                              ATIV_COLORS.length
                          ],
                      }}
                    >
                      <Icon
                        name={
                          index === 2
                            ? 'bank'
                            : 'editsq'
                        }
                        size={18}
                      />
                    </span>

                    <div className="ec-rb">
                      <b>
                        {item.title}
                      </b>

                      <small>
                        {item.sub}
                      </small>
                    </div>

                    <Pill
                      text={item.pill}
                    />
                  </a>
                ))}
              </div>
            </Gate>
          </EcCard>

          {/* ===============================================
              AURA
          =============================================== */}

          <EcCard className="ec-promo">
            <div
              className="ec-promo-art"
              aria-hidden
            />

            <div className="ec-aura-h slim">
              <img
                src={`${A}/prof-aura-icon.png`}
                alt=""
                width={26}
                height={26}
                className="px"
              />

              <b>
                Aura IA <em>Beta</em>
              </b>
            </div>

            <p>
              Planeje aulas, crie atividades,
              gere avaliações e muito mais com
              o poder da IA.
            </p>

            <a
              className="ec-btn"
              href="/app/aura"
            >
              Acessar Aura IA

              <Icon
                name="arrow"
                size={16}
              />
            </a>
          </EcCard>
        </>
      }
    >
      {/* =====================================================
          HERO
      ===================================================== */}

      <EcHero
        title="Olá, Professor!"
        sub="Você está fazendo a diferença!"
        text="Aqui você encontra todas as ferramentas para planejar, ensinar, acompanhar e evoluir com seus alunos."
        cta="Criar nova atividade"
        ctaLeft="plusc"
        ctaRight="plus"
        href="/app/atividades/nova"
        quote="Grandes conquistas começam com bons professores."
        art={`${A}/prof-hero-scene.png`}
        artWidth={506}
      />

      {/* =====================================================
          KPIs
      ===================================================== */}

      <div className="ec-kpis">
        {d.kpis.map((kpi, index) => (
          <EcCard
            key={kpi.label}
            className="ec-kpi"
          >
            <span className="ec-kic pr">
              <Icon
                name={
                  KPI_ICONS[
                    index %
                      KPI_ICONS.length
                  ]
                }
                size={26}
              />
            </span>

            <div className="ec-rb">
              <small>
                {kpi.label}
              </small>

              <b>
                {status === 'loading'
                  ? '–'
                  : kpi.value}
              </b>

              <span
                className={`ec-sub ${
                  String(kpi.sub).startsWith('+')
                    ? 'up'
                    : ''
                }`}
              >
                {kpi.sub}
              </span>
            </div>
          </EcCard>
        ))}
      </div>

      {/* =====================================================
          TURMAS + DESEMPENHO
      ===================================================== */}

      <div className="ec-cols turmas">
        {/* ===============================================
            MINHAS TURMAS
        =============================================== */}

        <EcCard
          title="Minhas turmas"
          link="Ver todas"
          href="/app/dashboard/professor/turmas"
        >
          <Gate
            status={status}
            items={d.turmas}
            empty="Nenhuma turma"
            emptyText="Crie sua primeira turma para começar."
            retry={retry}
          >
            <div className="ec-turmas">
              {(
                d.turmas as unknown as EcItem[]
              ).map((turma, index) => {
                const color =
                  TURMA_COLORS[
                    index %
                      TURMA_COLORS.length
                  ];

                return (
                  <a
                    key={
                      turma.id ?? index
                    }
                    href="#"
                    className="ec-turma"
                  >
                    <span
                      className="ec-tile"
                      style={{
                        background:
                          color,
                      }}
                    >
                      <Icon
                        name={turmaIcon(
                          turma.title,
                        )}
                        size={26}
                      />
                    </span>

                    <div className="ec-rb">
                      <b>
                        {turma.title}
                      </b>

                      <small>
                        {turma.sub}
                      </small>

                      <div className="ec-bar">
                        <i
                          style={{
                            width: `${turma.pct ?? 0}%`,
                            background:
                              color,
                          }}
                        />
                      </div>
                    </div>

                    <div className="ec-tr">
                      <b>
                        {turma.pct ?? 0}%
                      </b>

                      <small>
                        em andamento
                      </small>
                    </div>

                    <Icon
                      name="right"
                      size={16}
                    />
                  </a>
                );
              })}
            </div>
          </Gate>
        </EcCard>

        {/* ===============================================
            DESEMPENHO
        =============================================== */}

        <EcCard title="Desempenho dos alunos">
          <div
            className="ec-seg"
            role="tablist"
          >
            {TABS.map(
              (tabName, index) => (
                <button
                  key={tabName}
                  type="button"
                  role="tab"
                  aria-selected={
                    tab === index
                  }
                  className={
                    tab === index
                      ? 'on'
                      : ''
                  }
                  onClick={() =>
                    setTab(index)
                  }
                >
                  {tabName}
                </button>
              ),
            )}
          </div>

          {status !== 'ready' ? (
            <StateBox
              status={
                status as ComponentProps<
                  typeof StateBox
                >['status']
              }
              onRetry={retry}
            />
          ) : (
            <>
              <div className="ec-perf2">
                <div
                  className="ec-ring"
                  style={{
                    background: `conic-gradient(#7a29fd 0 ${media}%, #2f1587 ${media}% 100%)`,
                  }}
                >
                  <div>
                    <b>
                      {media}%
                    </b>

                    <small>
                      Média geral
                    </small>
                  </div>
                </div>

                <div className="ec-leg">
                  {legend.map(
                    (item, index) => (
                      <div
                        key={item.t}
                      >
                        <i
                          style={{
                            background:
                              item.c,
                          }}
                        />

                        <span>
                          <small>
                            {item.t}
                          </small>

                          <b>
                            {
                              item.v[0]
                            }
                          </b>
                        </span>

                        <em
                          className={
                            index === 0
                              ? 'first'
                              : ''
                          }
                        >
                          {
                            item.v[1]
                          }
                          %
                        </em>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <b className="ec-evo-t">
                Evolução da turma
              </b>

              <div
                className="ec-chart"
                role="img"
                aria-label="Evolução da turma nas últimas semanas"
              >
                <div className="ec-ylab">
                  {[
                    100,
                    75,
                    50,
                    25,
                  ].map(
                    (value) => (
                      <span
                        key={value}
                        style={{
                          top: `${yOf(value)}%`,
                        }}
                      >
                        {value}%
                      </span>
                    ),
                  )}
                </div>

                <div className="ec-plot">
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {[
                      100,
                      75,
                      50,
                      25,
                    ].map(
                      (value) => (
                        <line
                          key={value}
                          x1="0"
                          x2="100"
                          y1={yOf(value)}
                          y2={yOf(value)}
                        />
                      ),
                    )}

                    {evo.map(
                      (_, index) => (
                        <line
                          key={index}
                          className="v"
                          x1={xOf(index)}
                          x2={xOf(index)}
                          y1="0"
                          y2="100"
                        />
                      ),
                    )}

                    <polyline
                      points={line}
                      fill="none"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>

                  {evo.map(
                    (value, index) => (
                      <i
                        key={index}
                        style={{
                          left: `${xOf(index)}%`,
                          top: `${yOf(value)}%`,
                        }}
                      />
                    ),
                  )}
                </div>

                <div className="ec-xlab">
                  {[
                    'Sem 1',
                    'Sem 2',
                    'Sem 3',
                    'Sem 4',
                  ].map(
                    (week) => (
                      <span key={week}>
                        {week}
                      </span>
                    ),
                  )}
                </div>
              </div>
            </>
          )}
        </EcCard>
      </div>

      {/* =====================================================
          FERRAMENTAS + ENTREGAS
      ===================================================== */}

      <div className="ec-cols bottom">
        {/* ===============================================
            FERRAMENTAS
        =============================================== */}

        <EcCard title="Ferramentas rápidas">
          <div className="ec-tools5">
            {d.ferramentas
              .slice(0, 5)
              .map(
                (tool, index) => (
                  <a
                    key={tool.t}
                    href="#"
                  >
                    <span className="top">
                      <span
                        className="ec-tile sm"
                        style={{
                          background:
                            '#3a1aa8',
                        }}
                      >
                        <Icon
                          name={
                            TOOL_ICONS[
                              index %
                                TOOL_ICONS.length
                            ]
                          }
                          size={18}
                        />
                      </span>

                      <Icon
                        name="right"
                        size={14}
                      />
                    </span>

                    <b>
                      {tool.t}
                    </b>

                    <small>
                      {tool.s}
                    </small>
                  </a>
                ),
              )}
          </div>
        </EcCard>

        {/* ===============================================
            ÚLTIMAS ENTREGAS
        =============================================== */}

        <EcCard
          title="Últimas entregas"
          link="Ver todas"
          href="/app/dashboard/professor/correcoes"
          className="ec-entregas"
        >
          <Gate
            status={status}
            items={d.entregas}
            empty="Nenhuma entrega"
            emptyText="As entregas dos alunos aparecem aqui."
            retry={retry}
          >
            <div className="ec-ent-list">
              {(
                d.entregas as unknown as EcItem[]
              ).map(
                (entrega, index) => (
                  <a
                    key={
                      entrega.id ??
                      index
                    }
                    href="#"
                    className="ec-ent"
                  >
                    <img
                      src={
                        AVATARS[
                          index %
                            AVATARS.length
                        ]
                      }
                      alt=""
                      className="px"
                    />

                    <div className="ec-rb">
                      <b>
                        {entrega.title}
                      </b>

                      <small>
                        {entrega.sub}
                      </small>
                    </div>

                    <small className="when">
                      {stringValue(
                        entrega.hora,
                      ) ??
                        stringValue(
                          entrega.time,
                        ) ??
                        stringValue(
                          entrega.quando,
                        ) ??
                        ''}
                    </small>

                    <span className="ec-pill ok">
                      {entrega.pill ??
                        'Entregue'}
                    </span>
                  </a>
                ),
              )}
            </div>
          </Gate>
        </EcCard>
      </div>
    </EcShell>
  );
}

