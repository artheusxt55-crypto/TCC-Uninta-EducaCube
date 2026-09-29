import './DashboardAluno.css';
import { Shell, Card, List, Calendar, AuraCard, StateBox, useMockData, type NavItem } from '../components/dashboard/shared';
import { alunoMock } from '../mocks/dashboardMocks';

const nav: NavItem[] = [
  { label: 'Início', icon: '⌂', to: '/app/dashboard/aluno' },
  { label: 'Minhas aulas', icon: '📖', to: '/app/dashboard/aluno/aulas' },
  { label: 'Minhas atividades', icon: '✔', badge: 3, to: '/app/dashboard/aluno/atividades' },
  { label: 'Meus projetos', icon: '🔬', to: '/app/dashboard/aluno/projetos' },
  { label: 'Materiais', icon: '📄', to: '/app/dashboard/aluno/materiais' },
  { label: 'Meu progresso', icon: '📈', to: '/app/dashboard/aluno/progresso' },
  { label: 'Biblioteca', icon: '📚', to: '/app/dashboard/aluno/biblioteca' },
  { label: 'Configurações', icon: '⚙', to: '/app/dashboard/aluno/configuracoes' },
  { label: 'Sair', icon: '⏻', to: '/logout', isExit: true },
];

export default function DashboardAluno() {
  const { status, data, retry } = useMockData(alunoMock);
  const d = data ?? alunoMock;
  return (
    <div className="dsh-aluno">
      <Shell nav={nav} active="Início" user={`${d.nome} Silva`} role="Aluno" searchPlaceholder="Buscar aulas, materiais, conteúdos..."
        quote="Você consegue! Cada pequeno avanço conta!"
        aside={<>
          <AuraCard>
            <a href="#" className="chat">Olá, {d.nome}! Em que posso te ajudar hoje?</a>
            <input className="chat" placeholder="Pergunte algo sobre suas aulas..." aria-label="Pergunte à Aura" />
          </AuraCard>
          <Calendar title="Seu calendário" />
          <Card><div className="goal"><span className="dsh-tile" style={{ background: '#3b1fa8' }}>◎</span>
            <div style={{ flex: 1 }}><b>{d.metas.titulo}</b><br /><small>{d.metas.sub}</small><div className="dsh-bar"><i style={{ width: `${d.metas.pct}%` }} /></div></div>
            <span className="dsh-num">{d.metas.pct}%</span></div></Card>
          <Card className="mascot-card"><span aria-hidden>🧑‍🎓</span><blockquote>Estudo hoje, conquisto amanhã!</blockquote></Card>
        </>}>
        <Card className="dsh-hero">
          <h1>Olá, {d.nome}! 👋</h1><h3>Que bom te ver por aqui!</h3>
          <p>O conhecimento é a chave para grandes conquistas. Continue firme!</p>
          <a className="dsh-btn" href="/app/aura">Explorar a Aura IA →</a>
          <span className="art" aria-hidden>🦉</span><blockquote>“Grandes sonhos começam com pequenos passos.”</blockquote>
        </Card>
        <div className="dsh-kpis">{d.kpis.map((k) => (
          <Card key={k.label} className="dsh-kpi"><span className="ic" aria-hidden>{k.icon}</span>
            <div><small>{k.label}</small><b>{status === 'loading' ? '–' : k.value} <small>{k.of}</small></b>
              {k.pct != null && <div className="dsh-bar"><i style={{ width: `${k.pct}%` }} /></div>}{k.trend && <span className="g">{k.trend}</span>}</div></Card>))}</div>
        <div className="dsh-two">
          <Card title="Minhas disciplinas" link="Ver todas"><List status={status} items={d.disciplinas} pct empty="Nenhuma disciplina" emptyText="Suas disciplinas aparecem aqui quando você for matriculado." onRetry={retry} /></Card>
          <Card title="Próximas aulas" link="Ver todas"><List status={status} items={d.aulas} empty="Nenhuma aula agendada" emptyText="Quando houver uma aula marcada, ela aparece aqui." onRetry={retry} /></Card>
        </div>
        <div className="dsh-two">
          <Card title="Tarefas recentes" link="Ver todas"><List status={status} items={d.tarefas} empty="Nenhuma atividade" emptyText="Você está em dia. Novas tarefas aparecem aqui." onRetry={retry} /></Card>
          <Card className="well"><span className="art" aria-hidden>🦉</span><h3>Você está indo muito bem!</h3><small>Sua dedicação hoje constrói o seu futuro amanhã.</small><br /><br />
            <a className="dsh-btn" href="/app/aulas">Continuar estudando →</a></Card>
        </div>
        <div className="dsh-two">
          <Card title="Meus projetos" link="Ver todos"><List status={status} items={d.projetos} pct empty="Nenhum projeto" emptyText="Quando você entrar em um projeto, ele aparece aqui." onRetry={retry} /></Card>
          <Card title="Materiais recentes" link="Ver todos"><List status={status} items={d.materiais} empty="Nenhum material" emptyText="Materiais enviados pelos professores aparecem aqui." onRetry={retry} /></Card>
        </div>
        {status === 'error' && <StateBox status="error" onRetry={retry} />}
      </Shell>
    </div>
  );
}
