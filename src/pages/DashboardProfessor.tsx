import { useState, type ReactNode } from 'react';
import '../styles/educacube-dashboard.css';
import '../styles/educacube-professor.css';
import { StateBox } from '../components/dashboard/shared';
import {
  EcShell, EcCard, EcHero, EcCalendar, Pill, Icon, dataExtenso, useLoggedUser, useMockData,
  type EcNavItem, type EcItem, type IconName,
} from '../components/dashboard/ecShared';
import { professorMock } from '../components/mocks/dashboardMocks';

const A = '/assets/dashboard';
const nav: EcNavItem[] = [
  { label: 'Dashboard', icon: 'home', to: '/app/dashboard/professor' },
  { label: 'Turmas', icon: 'users', to: '/app/dashboard/professor/turmas' },
  { label: 'Meus Alunos', icon: 'user', to: '/app/dashboard/professor/alunos' },
  { label: 'Conteúdos', icon: 'book', to: '/app/dashboard/professor/conteudos' },
  { label: 'Avaliações', icon: 'editsq', to: '/app/dashboard/professor/avaliacoes' },
  { label: 'Atividades', icon: 'file', to: '/app/dashboard/professor/atividades' },
  { label: 'Correções', icon: 'checksq', to: '/app/dashboard/professor/correcoes' },
  { label: 'Biblioteca', icon: 'tasks', to: '/app/dashboard/professor/biblioteca' },
  { label: 'IA - Aura', icon: 'spark', to: '/app/dashboard/professor/aura' },
  { label: 'Relatórios', icon: 'chart', to: '/app/dashboard/professor/relatorios' },
  { label: 'Calendário', icon: 'cal', to: '/app/dashboard/professor/calendario' },
  { label: 'Configurações', icon: 'gear', to: '/app/dashboard/professor/configuracoes' },
];

const KPI_ICONS: IconName[] = ['users', 'users', 'editsq', 'checksq'];
const TOOL_ICONS: IconName[] = ['editsq', 'checksq', 'spark', 'upload', 'book'];
const TURMA_COLORS = ['#6d28f9', '#1f6be8', '#12a97a', '#f0a01c', '#d0289f'];
const HOJE_COLORS = ['#c0269f', '#12a394', '#c0269f'];
const ATIV_COLORS = ['#c0269f', '#c0269f', '#4b1fc7'];
const AVATARS = [`${A}/prof-av1.png`, `${A}/prof-av2.png`, `${A}/prof-av3.png`];
const TABS = ['Visão geral', 'Por turma', 'Por matéria'];

const slug = (s = '') => s.normalize('NFD').replace(/[\u0300-\u036f\s]/g, '').toLowerCase();
function turmaIcon(t: string): IconName {
  const s = slug(t);
  if (s.includes('matem')) return 'pi';
  if (s.includes('ingl')) return 'lang';
  if (s.includes('cienc')) return 'flask';
  if (s.includes('hist')) return 'bank';
  return 'editsq';
}
const str = (v: unknown) => (typeof v === 'string' ? v : undefined);

function Gate(p: { status: string; items?: readonly unknown[]; empty: string; emptyText: string; retry: () => void; children: ReactNode }) {
  if (p.status !== 'ready' || !p.items?.length)
    return <StateBox status={(p.status === 'ready' ? 'empty' : p.status) as React.ComponentProps<typeof StateBox>['status']} empty={p.empty} emptyText={p.emptyText} onRetry={p.retry} />;
  return <>{p.children}</>;
}

export default function DashboardProfessor() {
  const { status, data, retry } = useMockData(professorMock);
  const d = data ?? professorMock;
  const { full } = useLoggedUser('João Silva'); // nome da conta logada
  const [tab, setTab] = useState(0);

  const des = d.desempenho;
  const media = des.media;
  const evo = des.evolucao;
  const yOf = (v: number) => Math.min(100, Math.max(0, 100 - ((v - 20) / 80) * 100));
  const xOf = (i: number) => (evo.length > 1 ? (i / (evo.length - 1)) * 100 : 0);
  const line = evo.map((v, i) => `${xOf(i)},${yOf(v)}`).join(' ');
  const legend = [
    { c: '#12c192', t: 'Aprovados', v: des.aprovados },
    { c: '#f0a01c', t: 'Em recuperação', v: des.recuperacao },
    { c: '#ef3b4a', t: 'Abaixo da média', v: des.abaixo },
  ];

  return (
    <EcShell
      pageClass="dsh-prof" nav={nav} active="Dashboard" role="Professor"
      userName={/^prof/i.test(full) ? full : `Prof. ${full}`}
      searchPlaceholder="Buscar alunos, turmas, conteúdos, avaliações..."
      themeToggle mascotImg={`${A}/prof-owl-sidebar.png`} footerLogo={`${A}/prof-logo-outline.png`}
      mascotText={<>Juntos por<br />uma educação<br />mais inteligente.</>}
      aside={<>
        <EcCard className="ec-hoje">
          <div className="ec-hoje-h"><h2>Hoje</h2><small>{dataExtenso()}</small><Icon name="cal" size={20} /></div>
          <Gate status={status} items={d.hoje} empty="Nada na agenda hoje" emptyText="Seus compromissos do dia aparecem aqui." retry={retry}>
            <div className="ec-acc-list">{(d.hoje as unknown as EcItem[]).map((h, i) => (
              <a key={h.id ?? i} href="#" className="ec-acc" style={{ '--c': HOJE_COLORS[i % 3] } as React.CSSProperties}>
                <span className="ec-tile sm"><Icon name={i === 1 ? 'lang' : 'editsq'} size={18} /></span>
                <div className="ec-rb"><b>{h.title}</b><small>{h.sub}</small></div><Pill text={h.pill} />
              </a>))}</div>
          </Gate>
        </EcCard>

        <EcCalendar title="Calendário de aulas e atividades" link={false} />

        <EcCard title="Próximas atividades" link="Ver todas" href="/app/dashboard/professor/atividades">
          <Gate status={status} items={d.proximas} empty="Nenhuma atividade" emptyText="Crie uma atividade para vê-la aqui." retry={retry}>
            <div className="ec-acc-list flat">{(d.proximas as unknown as EcItem[]).map((h, i) => (
              <a key={h.id ?? i} href="#" className="ec-acc" style={{ '--c': ATIV_COLORS[i % 3] } as React.CSSProperties}>
                <span className="ec-tile sm" style={{ background: ATIV_COLORS[i % 3] }}><Icon name={i === 2 ? 'bank' : 'editsq'} size={18} /></span>
                <div className="ec-rb"><b>{h.title}</b><small>{h.sub}</small></div><Pill text={h.pill} />
              </a>))}</div>
          </Gate>
        </EcCard>

        <EcCard className="ec-promo">
          <div className="ec-promo-art" aria-hidden />
          <div className="ec-aura-h slim">
            <img src={`${A}/prof-aura-icon.png`} alt="" width={26} height={26} className="px" />
            <b>Aura IA <em>Beta</em></b>
          </div>
          <p>Planeje aulas, crie atividades, gere avaliações e muito mais com o poder da IA.</p>
          <a className="ec-btn" href="/app/aura">Acessar Aura IA <Icon name="arrow" size={16} /></a>
        </EcCard>
      </>}
    >
      <EcHero
        title="Olá, Professor!" sub="Você está fazendo a diferença!"
        text="Aqui você encontra todas as ferramentas para planejar, ensinar, acompanhar e evoluir com seus alunos."
        cta="Criar nova atividade" ctaLeft="plusc" ctaRight="plus" href="/app/atividades/nova"
        quote="Grandes conquistas começam com bons professores."
        art={`${A}/prof-hero-scene.png`} artWidth={506}
      />

      <div className="ec-kpis">{d.kpis.map((k, i) => (
        <EcCard key={k.label} className="ec-kpi">
          <span className="ec-kic pr"><Icon name={KPI_ICONS[i % 4]} size={26} /></span>
          <div className="ec-rb">
            <small>{k.label}</small>
            <b>{status === 'loading' ? '–' : k.value}</b>
            <span className={`ec-sub ${String(k.sub).startsWith('+') ? 'up' : ''}`}>{k.sub}</span>
          </div>
        </EcCard>))}
      </div>

      <div className="ec-cols turmas">
        <EcCard title="Minhas turmas" link="Ver todas" href="/app/dashboard/professor/turmas">
          <Gate status={status} items={d.turmas} empty="Nenhuma turma" emptyText="Crie sua primeira turma para começar." retry={retry}>
            <div className="ec-turmas">{(d.turmas as unknown as EcItem[]).map((t, i) => {
              const c = TURMA_COLORS[i % 5];
              return (
                <a key={t.id ?? i} href="#" className="ec-turma">
                  <span className="ec-tile" style={{ background: c }}><Icon name={turmaIcon(t.title)} size={26} /></span>
                  <div className="ec-rb"><b>{t.title}</b><small>{t.sub}</small>
                    <div className="ec-bar"><i style={{ width: `${t.pct ?? 0}%`, background: c }} /></div></div>
                  <div className="ec-tr"><b>{t.pct ?? 0}%</b><small>em andamento</small></div>
                  <Icon name="right" size={16} />
                </a>);
            })}</div>
          </Gate>
        </EcCard>

        <EcCard title="Desempenho dos alunos">
          <div className="ec-seg" role="tablist">{TABS.map((t, i) => (
            <button key={t} role="tab" aria-selected={tab === i} className={tab === i ? 'on' : ''} onClick={() => setTab(i)}>{t}</button>))}</div>
          {status !== 'ready' ? <StateBox status={status} onRetry={retry} /> : <>
            <div className="ec-perf2">
              <div className="ec-ring" style={{ background: `conic-gradient(#7a29fd 0 ${media}%, #2f1587 ${media}% 100%)` }}>
                <div><b>{media}%</b><small>Média geral</small></div></div>
              <div className="ec-leg">{legend.map((l, i) => (
                <div key={l.t}><i style={{ background: l.c }} />
                  <span><small>{l.t}</small><b>{l.v[0]}</b></span>
                  <em className={i === 0 ? 'first' : ''}>{l.v[1]}%</em></div>))}</div>
            </div>
            <b className="ec-evo-t">Evolução da turma</b>
            <div className="ec-chart" role="img" aria-label="Evolução da turma nas últimas semanas">
              <div className="ec-ylab">{[100, 75, 50, 25].map((v) => <span key={v} style={{ top: `${yOf(v)}%` }}>{v}%</span>)}</div>
              <div className="ec-plot">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                  {[100, 75, 50, 25].map((v) => <line key={v} x1="0" x2="100" y1={yOf(v)} y2={yOf(v)} />)}
                  {evo.map((_, i) => <line key={i} className="v" x1={xOf(i)} x2={xOf(i)} y1="0" y2="100" />)}
                  <polyline points={line} fill="none" vectorEffect="non-scaling-stroke" />
                </svg>
                {evo.map((v, i) => <i key={i} style={{ left: `${xOf(i)}%`, top: `${yOf(v)}%` }} />)}
              </div>
              <div className="ec-xlab">{['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'].map((s) => <span key={s}>{s}</span>)}</div>
            </div></>}
        </EcCard>
      </div>

      <div className="ec-cols bottom">
        <EcCard title="Ferramentas rápidas">
          <div className="ec-tools5">{d.ferramentas.slice(0, 5).map((f, i) => (
            <a key={f.t} href="#">
              <span className="top"><span className="ec-tile sm" style={{ background: '#3a1aa8' }}><Icon name={TOOL_ICONS[i % 5]} size={18} /></span><Icon name="right" size={14} /></span>
              <b>{f.t}</b><small>{f.s}</small>
            </a>))}</div>
        </EcCard>

        <EcCard title="Últimas entregas" link="Ver todas" href="/app/dashboard/professor/correcoes" className="ec-entregas">
          <Gate status={status} items={d.entregas} empty="Nenhuma entrega" emptyText="As entregas dos alunos aparecem aqui." retry={retry}>
            <div className="ec-ent-list">{(d.entregas as unknown as EcItem[]).map((e, i) => (
              <a key={e.id ?? i} href="#" className="ec-ent">
                <img src={AVATARS[i % 3]} alt="" className="px" />
                <div className="ec-rb"><b>{e.title}</b><small>{e.sub}</small></div>
                <small className="when">{str(e.hora) ?? str(e.time) ?? str(e.quando) ?? ''}</small>
                <span className="ec-pill ok">{e.pill ?? 'Entregue'}</span>
              </a>))}</div>
          </Gate>
        </EcCard>
      </div>
    </EcShell>
  );
}
