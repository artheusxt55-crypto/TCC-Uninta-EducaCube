import { useState, type CSSProperties, type ReactNode } from 'react';

import '../styles/educacube-dashboard.css';
import '../styles/educacube-aluno.css';

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

import { alunoMock } from '../components/mocks/dashboardMocks';

const A = '/assets/dashboard';

const nav: EcNavItem[] = [
  { label: 'Dashboard', icon: 'home', to: '/app/dashboard/aluno' },
  { label: 'Minhas Disciplinas', icon: 'book', to: '/app/dashboard/aluno/disciplinas' },
  { label: 'Atividades', icon: 'file', to: '/app/dashboard/aluno/atividades' },
  { label: 'Avaliações', icon: 'editsq', to: '/app/dashboard/aluno/avaliacoes' },
  { label: 'Notas', icon: 'chart', to: '/app/dashboard/aluno/notas' },
  { label: 'Calendário', icon: 'cal', to: '/app/dashboard/aluno/calendario' },
  { label: 'Biblioteca', icon: 'tasks', to: '/app/dashboard/aluno/biblioteca' },
  { label: 'Aura IA', icon: 'spark', to: '/app/dashboard/aluno/aura' },
  { label: 'Configurações', icon: 'gear', to: '/app/dashboard/aluno/configuracoes' },
];

const KPI_ICONS: IconName[] = ['editsq', 'checksq', 'chart', 'book'];
const DISC_ICONS: IconName[] = ['pi', 'lang', 'flask', 'bank', 'editsq'];
const ATIV_COLORS = ['#6d28f9', '#1f6be8', '#12a97a', '#f0a01c'];
const AVATARS = [
  `${A}/aluno-av1.png`,
  `${A}/aluno-av2.png`,
  `${A}/aluno-av3.png`,
];

const str = (v: unknown) =>
  typeof v === 'string' ? v : undefined;

function slug(s: string = '') {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f\s]/g, '')
    .toLowerCase();
}

function disciplinaIcon(nome: string): IconName {
  const s = slug(nome);

  if (s.includes('matem')) return 'pi';
  if (s.includes('ingl')) return 'lang';
  if (s.includes('cienc')) return 'flask';
  if (s.includes('hist')) return 'bank';

  return 'book';
}

function Gate(props: {
  status: string;
  items?: readonly unknown[];
  empty: string;
  emptyText: string;
  retry: () => void;
  children: ReactNode;
}) {
  if (props.status !== 'ready' || !props.items?.length) {
    return (
      <StateBox
        status={
          (props.status === 'ready' ? 'empty' : props.status) as
            React.ComponentProps<typeof StateBox>['status']
        }
        empty={props.empty}
        emptyText={props.emptyText}
        onRetry={props.retry}
      />
    );
  }

  return <>{props.children}</>;
}

export default function DashboardAluno() {
  const { status, data, retry } = useMockData(alunoMock);
  const d = data ?? alunoMock;

  const { full } = useLoggedUser('Aluno');
  const [tab, setTab] = useState(0);

  const desempenho = d.desempenho;

  const media =
    typeof desempenho.media === 'number'
      ? desempenho.media
      : 0;

  const evolucao =
    Array.isArray(desempenho.evolucao)
      ? desempenho.evolucao
      : [];

  const yOf = (v: number) =>
    Math.min(100, Math.max(0, 100 - ((v - 20) / 80) * 100));

  const xOf = (i: number) =>
    evolucao.length > 1
      ? (i / (evolucao.length - 1)) * 100
      : 0;

  const line = evolucao
    .map((v: number, i: number) => `${xOf(i)},${yOf(v)}`)
    .join(' ');

  const legend = [
    {
      c: '#12c192',
      t: 'Acima da média',
      v: desempenho.acima,
    },
    {
      c: '#f0a01c',
      t: 'Na média',
      v: desempenho.mediaQtd,
    },
    {
      c: '#ef3b4a',
      t: 'Abaixo da média',
      v: desempenho.abaixo,
    },
  ];

  return (
    <EcShell
      pageClass="dsh-aluno"
      nav={nav}
      active="Dashboard"
      role="Aluno"
      userName={full}
      searchPlaceholder="Buscar disciplinas, atividades, conteúdos..."
      themeToggle
      mascotImg={`${A}/aluno-mascot-sidebar.png`}
      footerLogo={`${A}/aluno-logo-outline.png`}
      mascotText={
        <>
          Continue
          <br />
          aprendendo e
          <br />
          evoluindo!
        </>
      }
      aside={
        <>
          <EcCard className="ec-hoje">
            <div className="ec-hoje-h">
              <h2>Hoje</h2>
              <small>{dataExtenso()}</small>
              <Icon name="cal" size={20} />
            </div>

            <Gate
              status={status}
              items={d.hoje}
              empty="Nada para hoje"
              emptyText="Suas atividades do dia aparecem aqui."
              retry={retry}
            >
              <div className="ec-acc-list">
                {(d.hoje as unknown as EcItem[]).map(
                  (h: EcItem, i: number) => (
                    <a
                      key={h.id ?? i}
                      href="#"
                      className="ec-acc"
                      style={
                        {
                          '--c': ATIV_COLORS[i % ATIV_COLORS.length],
                        } as CSSProperties
                      }
                    >
                      <span className="ec-tile sm">
                        <Icon
                          name={
                            i === 1
                              ? 'lang'
                              : i === 2
                                ? 'checksq'
                                : 'editsq'
                          }
                          size={18}
                        />
                      </span>

                      <div className="ec-rb">
                        <b>{h.title}</b>
                        <small>{h.sub}</small>
                      </div>

                      <Pill text={h.pill} />
                    </a>
                  ),
                )}
              </div>
            </Gate>
          </EcCard>

          <EcCalendar
            title="Meu calendário"
            link={false}
          />

          <EcCard
            title="Próximas atividades"
            link="Ver todas"
            href="/app/dashboard/aluno/atividades"
          >
            <Gate
              status={status}
              items={d.proximas}
              empty="Nenhuma atividade"
              emptyText="As próximas atividades aparecerão aqui."
              retry={retry}
            >
              <div className="ec-acc-list flat">
                {(d.proximas as unknown as EcItem[]).map(
                  (item: EcItem, i: number) => (
                    <a
                      key={item.id ?? i}
                      href="#"
                      className="ec-acc"
                      style={
                        {
                          '--c': ATIV_COLORS[i % ATIV_COLORS.length],
                        } as CSSProperties
                      }
                    >
                      <span
                        className="ec-tile sm"
                        style={{
                          background:
                            ATIV_COLORS[
                              i % ATIV_COLORS.length
                            ],
                        }}
                      >
                        <Icon
                          name={
                            i % 2 === 0
                              ? 'editsq'
                              : 'book'
                          }
                          size={18}
                        />
                      </span>

                      <div className="ec-rb">
                        <b>{item.title}</b>
                        <small>{item.sub}</small>
                      </div>

                      <Pill text={item.pill} />
                    </a>
                  ),
                )}
              </div>
            </Gate>
          </EcCard>

          <EcCard className="ec-promo">
            <div
              className="ec-promo-art"
              aria-hidden
            />

            <div className="ec-aura-h slim">
              <img
                src={`${A}/aluno-aura-icon.png`}
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
              Tire dúvidas, revise conteúdos,
              organize seus estudos e aprenda
              de forma mais inteligente.
            </p>

            <a
              className="ec-btn"
              href="/app/aura"
            >
              Acessar Aura IA
              <Icon name="arrow" size={16} />
            </a>
          </EcCard>
        </>
      }
    >
      <EcHero
        title="Olá, Aluno!"
        sub="Vamos continuar aprendendo?"
        text="Acompanhe suas atividades, notas, disciplinas e tudo o que você precisa para evoluir nos estudos."
        cta="Ver minhas atividades"
        ctaLeft="editsq"
        ctaRight="arrow"
        href="/app/dashboard/aluno/atividades"
        quote="Cada novo conhecimento é um passo a mais na sua evolução."
        art={`${A}/aluno-hero-scene.png`}
        artWidth={506}
      />

      <div className="ec-kpis">
        {d.kpis.map(
          (
            k: {
              label: string;
              value: string | number;
              sub: string;
            },
            i: number,
          ) => (
            <EcCard
              key={k.label}
              className="ec-kpi"
            >
              <span className="ec-kic pr">
                <Icon
                  name={KPI_ICONS[i % KPI_ICONS.length]}
                  size={26}
                />
              </span>

              <div className="ec-rb">
                <small>{k.label}</small>

                <b>
                  {status === 'loading'
                    ? '–'
                    : k.value}
                </b>

                <span
                  className={`ec-sub ${
                    String(k.sub).startsWith('+')
                      ? 'up'
                      : ''
                  }`}
                >
                  {k.sub}
                </span>
              </div>
            </EcCard>
          ),
        )}
      </div>

      <div className="ec-cols turmas">
        <EcCard
          title="Minhas disciplinas"
          link="Ver todas"
          href="/app/dashboard/aluno/disciplinas"
        >
          <Gate
            status={status}
            items={d.disciplinas}
            empty="Nenhuma disciplina"
            emptyText="Suas disciplinas aparecerão aqui."
            retry={retry}
          >
            <div className="ec-turmas">
              {(d.disciplinas as unknown as EcItem[]).map(
                (
                  disciplina: EcItem,
                  i: number,
                ) => {
                  const c =
                    ATIV_COLORS[
                      i % ATIV_COLORS.length
                    ];

                  return (
                    <a
                      key={disciplina.id ?? i}
                      href="#"
                      className="ec-turma"
                    >
                      <span
                        className="ec-tile"
                        style={{
                          background: c,
                        }}
                      >
                        <Icon
                          name={disciplinaIcon(
                            disciplina.title,
                          )}
                          size={26}
                        />
                      </span>

                      <div className="ec-rb">
                        <b>{disciplina.title}</b>
                        <small>{disciplina.sub}</small>

                        <div className="ec-bar">
                          <i
                            style={{
                              width: `${
                                disciplina.pct ?? 0
                              }%`,
                              background: c,
                            }}
                          />
                        </div>
                      </div>

                      <div className="ec-tr">
                        <b>
                          {disciplina.pct ?? 0}%
                        </b>
                        <small>concluído</small>
                      </div>

                      <Icon
                        name="right"
                        size={16}
                      />
                    </a>
                  );
                },
              )}
            </div>
          </Gate>
        </EcCard>

        <EcCard title="Meu desempenho">
          <div
            className="ec-seg"
            role="tablist"
          >
            {[
              'Visão geral',
              'Por disciplina',
              'Evolução',
            ].map(
              (t: string, i: number) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === i}
                  className={
                    tab === i ? 'on' : ''
                  }
                  onClick={() => setTab(i)}
                >
                  {t}
                </button>
              ),
            )}
          </div>

          {status !== 'ready' ? (
            <StateBox
              status={status}
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
                    <b>{media}%</b>
                    <small>Minha média</small>
                  </div>
                </div>

                <div className="ec-leg">
                  {legend.map(
                    (
                      item: {
                        c: string;
                        t: string;
                        v: [number, number];
                      },
                      i: number,
                    ) => (
                      <div key={item.t}>
                        <i
                          style={{
                            background: item.c,
                          }}
                        />

                        <span>
                          <small>{item.t}</small>
                          <b>
                            {item.v?.[0] ?? 0}
                          </b>
                        </span>

                        <em
                          className={
                            i === 0
                              ? 'first'
                              : ''
                          }
                        >
                          {item.v?.[1] ?? 0}%
                        </em>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <b className="ec-evo-t">
                Minha evolução
              </b>

              <div
                className="ec-chart"
                role="img"
                aria-label="Evolução do desempenho nas últimas semanas"
              >
                <div className="ec-ylab">
                  {[100, 75, 50, 25].map(
                    (v: number) => (
                      <span
                        key={v}
                        style={{
                          top: `${yOf(v)}%`,
                        }}
                      >
                        {v}%
                      </span>
                    ),
                  )}
                </div>

                <div className="ec-plot">
                  <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {[100, 75, 50, 25].map(
                      (v: number) => (
                        <line
                          key={v}
                          x1="0"
                          x2="100"
                          y1={yOf(v)}
                          y2={yOf(v)}
                        />
                      ),
                    )}

                    {evolucao.map(
                      (_: number, i: number) => (
                        <line
                          key={i}
                          className="v"
                          x1={xOf(i)}
                          x2={xOf(i)}
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

                  {evolucao.map(
                    (
                      v: number,
                      i: number,
                    ) => (
                      <i
                        key={i}
                        style={{
                          left: `${xOf(i)}%`,
                          top: `${yOf(v)}%`,
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
                  ].map((s: string) => (
                    <span key={s}>{s}</span>
                  ))}
                </div>
              </div>
            </>
          )}
        </EcCard>
      </div>

      <div className="ec-cols bottom">
        <EcCard title="Acesso rápido">
          <div className="ec-tools5">
            {d.ferramentas
              .slice(0, 5)
              .map(
                (
                  ferramenta: {
                    t: string;
                    s: string;
                  },
                  i: number,
                ) => (
                  <a
                    key={ferramenta.t}
                    href="#"
                  >
                    <span className="top">
                      <span
                        className="ec-tile sm"
                        style={{
                          background: '#3a1aa8',
                        }}
                      >
                        <Icon
                          name={
                            DISC_ICONS[
                              i %
                                DISC_ICONS.length
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

                    <b>{ferramenta.t}</b>
                    <small>{ferramenta.s}</small>
                  </a>
                ),
              )}
          </div>
        </EcCard>

        <EcCard
          title="Últimas atividades"
          link="Ver todas"
          href="/app/dashboard/aluno/atividades"
          className="ec-entregas"
        >
          <Gate
            status={status}
            items={d.entregas}
            empty="Nenhuma atividade recente"
            emptyText="Suas atividades recentes aparecerão aqui."
            retry={retry}
          >
            <div className="ec-ent-list">
              {(d.entregas as unknown as EcItem[]).map(
                (
                  entrega: EcItem,
                  i: number,
                ) => (
                  <a
                    key={entrega.id ?? i}
                    href="#"
                    className="ec-ent"
                  >
                    <img
                      src={
                        AVATARS[
                          i % AVATARS.length
                        ]
                      }
                      alt=""
                      className="px"
                    />

                    <div className="ec-rb">
                      <b>{entrega.title}</b>
                      <small>{entrega.sub}</small>
                    </div>

                    <small className="when">
                      {str(entrega.hora) ??
                        str(entrega.time) ??
                        str(entrega.quando) ??
                        ''}
                    </small>

                    <span className="ec-pill ok">
                      {entrega.pill ??
                        'Concluído'}
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
