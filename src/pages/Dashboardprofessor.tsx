import '../styles/DashboardProfessor.css';
import { Shell, Card, List, Calendar, StateBox, useMockData, type NavItem } from '../components/dashboard/shared';
import { professorMock } from '../mocks/dashboardMocks';

const nav: NavItem[] = [
  { label: 'Início', icon: '⌂', to: '/app/dashboard/professor' },
  { label: 'Meu trabalho', icon: '🗂', to: '/app/dashboard/professor/trabalho' },
  { label: 'Projetos', icon: '🔬', to: '/app/dashboard/professor/projetos' },
  { label: 'Planejamentos', icon: '🗒', to: '/app/dashboard/professor/planejamentos' },
  { label: 'Atividades', icon: '📄', to: '/app/dashboard/professor/atividades' },
  { label: 'Avaliações', icon: '📝', to: '/app/dashboard/professor/avaliacoes' },
  { label: 'Ferramentas', icon: '🛠', to: '/app/dashboard/professor/ferramentas' },
  { label: 'AURA', icon: '✦', to: '/app/dashboard/professor/aura' },
  { label: 'FaleSinal', icon: '🤟', to: '/app/dashboard/professor/falesinal' },
  { label: 'Turmas', icon: '👥', to: '/app/dashboard/professor/turmas' },
  { label: 'Arquivos', icon: '🗃', to: '/app/dashboard/professor/arquivos' },
  { label: 'Biblioteca', icon: '📚', to: '/app/dashboard/professor/biblioteca' },
  { label: 'Configurações', icon: '⚙', to: '/app/dashboard/professor/configuracoes' },
  { label: 'Sair', icon: '⏻', to: '/logout', isExit: true },
];

export default function DashboardProfessor() {
  const { status, data, retry } = useMockData(professorMock);
  const d = data ?? professorMock;
  const pts = d.desempenho.evolucao.map((v, i) => `${(i / 4) * 300},${100 - v}`).join(' ');
  return (
    <div className="dsh-prof">
      <Shell nav={nav} active="Início" user="Prof. João Silva" role="Professor" searchPlaceholder="Buscar alunos, turmas, conteúdos, avaliações..."
        quote="Juntos por uma educação mais inteligente."
        aside={<>
          <Card title="Hoje"><small>22 de Setembro de 2026</small><div style={{ marginTop: 10 }}>
            {status === 'ready' && d.hoje.length ? d.hoje.map((h) => <a key={h.id} href="#" className="dsh-row today-row"><div className="dsh-row-t"><b>{h.title}</b><small>{h.sub}</small></div><span className={`dsh-pill p-${h.pill?.normalize('NFD').replace(/[\u0300-\u036f\s]/g, '').toLowerCase()}`}>{h.pill}</span></a>)
              : <StateBox status={status === 'ready' ? 'empty' : status} empty="Nada na agenda hoje" emptyText="Seus compromissos do dia aparecem aqui." onRetry={retry} />}</div></Card>
          <Calendar title="Calendário de aulas e atividades" />
          <Card title="Próximas atividades"><List status={status} items={d.proximas} empty="Nenhuma atividade" emptyText="Crie uma atividade para vê-la aqui." onRetry={retry} /></Card>
          <Card className="promo"><b>Aura IA <i className="dsh-beta">Beta</i></b><p>Planeje aulas, crie atividades, gere avaliações e muito mais com o poder da IA.</p>
            <a className="dsh-btn" href="/app/aura">Acessar Aura IA →</a><span className="art" aria-hidden>🦉</span></Card>
        </>}>
        <Card className="dsh-hero"><h1>Olá, Professor! 👋</h1><h3>Você está fazendo a diferença!</h3>
          <p>Aqui você encontra todas as ferramentas para planejar, ensinar, acompanhar e evoluir com seus alunos.</p>
          <a className="dsh-btn" href="/app/atividades/nova">⊕ Criar nova atividade +</a>
          <span className="art" aria-hidden>🦉</span><blockquote>“Grandes conquistas começam com bons professores.”</blockquote></Card>
        <div className="dsh-kpis">{d.kpis.map((k) => (
          <Card key={k.label} className="dsh-kpi"><span className="ic" aria-hidden>{k.icon}</span>
            <div><small>{k.label}</small><b>{status === 'loading' ? '–' : k.value}</b><span className="g">{k.sub}</span></div></Card>))}</div>
        <div className="dsh-two">
          <Card title="Minhas turmas" link="Ver todas"><List status={status} items={d.turmas} pct empty="Nenhuma turma" emptyText="Crie sua primeira turma para começar." onRetry={retry} /></Card>
          <Card title="Desempenho dos alunos">
            <div className="tabs"><span className="on">Visão geral</span><span>Por turma</span><span>Por matéria</span></div>
            {status !== 'ready' ? <StateBox status={status} onRetry={retry} /> : <>
              <div className="perf"><div className="donut"><div>{d.desempenho.media}%<small>Média geral</small></div></div>
                <div className="legend"><span>Aprovados<b>{d.desempenho.aprovados[0]} • {d.desempenho.aprovados[1]}%</b></span><span>Em recuperação<b>{d.desempenho.recuperacao[0]} • {d.desempenho.recuperacao[1]}%</b></span><span>Abaixo da média<b>{d.desempenho.abaixo[0]} • {d.desempenho.abaixo[1]}%</b></span></div></div>
              <small>Evolução da turma</small>
              <svg className="line" viewBox="0 0 300 100" preserveAspectRatio="none" role="img" aria-label="Evolução em 4 semanas"><polyline points={pts} fill="none" stroke="#8f6cff" strokeWidth="2" /></svg></>}
          </Card>
        </div>
        <div className="dsh-bottom">
          <Card title="Ferramentas rápidas"><div className="tools">{d.ferramentas.map((f) => <a key={f.t} href="#" className="tool"><b>{f.t}</b><small>{f.s}</small></a>)}</div></Card>
          <Card title="Últimas entregas" link="Ver todas"><List status={status} items={d.entregas} empty="Nenhuma entrega" emptyText="As entregas dos alunos aparecem aqui." onRetry={retry} /></Card>
        </div>
        <div className="dsh-two">
          <Card title="Projetos recentes" link="Ver todos"><List status={status} items={d.projetos} pct empty="Nenhum projeto" emptyText="Crie um projeto para acompanhar aqui." onRetry={retry} /></Card>
          <Card title="Planejamentos" link="Ver todos"><List status={status} items={d.planejamentos} empty="Nenhum planejamento" emptyText="Seus planos de aula aparecem aqui." onRetry={retry} /></Card>
        </div>
        <Card title="Arquivos recentes" link="Ver todos"><List status={status} items={d.arquivos} empty="Nenhum arquivo" emptyText="Arquivos enviados aparecem aqui." onRetry={retry} /></Card>
      </Shell>
    </div>
  );
}
