import '../styles/educacube-dashboard.css';
import {
  EcShell, EcCard, EcHero, EcList, EcCalendar, Icon, IMG, useLoggedUser, useMockData,
  type EcNavItem, type IconName,
} from '../components/dashboard/ecShared';
import { alunoMock } from '../components/mocks/dashboardMocks';

const nav: EcNavItem[] = [
  { label: 'Dashboard', icon: 'home', to: '/app/dashboard/aluno' },
  { label: 'Minhas Aulas', icon: 'book', to: '/app/dashboard/aluno/aulas' },
  { label: 'Material de Apoio', icon: 'file', to: '/app/dashboard/aluno/materiais' },
  { label: 'Tarefas', icon: 'tasks', badge: 3, to: '/app/dashboard/aluno/atividades' },
  { label: 'Avaliações', icon: 'clip', to: '/app/dashboard/aluno/avaliacoes' },
  { label: 'Aura IA', icon: 'spark', to: '/app/aura' },
  { label: 'Biblioteca', icon: 'library', to: '/app/dashboard/aluno/biblioteca' },
  { label: 'Meu Progresso', icon: 'chart', to: '/app/dashboard/aluno/progresso' },
  { label: 'Notificações', icon: 'bell', badge: 2, to: '/app/dashboard/aluno/notificacoes' },
  { label: 'Configurações', icon: 'gear', to: '/app/dashboard/aluno/configuracoes' },
];
const KPI_ICONS: IconName[] = ['book', 'check', 'star', 'clock'];

export default function DashboardAluno() {
  const { status, data, retry } = useMockData(alunoMock);
  const d = data ?? alunoMock;
  const { full, first } = useLoggedUser(`${d.nome} Silva`); // nome da conta logada

  return (
    <EcShell
      pageClass="dsh-aluno" nav={nav} active="Dashboard" userName={full} role="Aluno"
      searchPlaceholder="Buscar aulas, materiais, conteúdos..."
      mascotText={<>Você consegue!<br />Cada pequeno<br />avanço conta!</>}
      aside={<>
        <EcCard className="ec-aura">
          <div className="ec-aura-h">
            <img src={IMG.owlAura} alt="" className="px" />
            <div><b>Aura IA <em>Beta</em></b><small>Sua assistente inteligente de estudos</small></div>
          </div>
          <a className="ec-chat" href="/app/aura"><span>Olá, {first}! 👋<br />Em que posso te ajudar hoje?</span><Icon name="right" size={16} /></a>
          <label className="ec-ask"><input placeholder="Pergunte algo sobre suas aulas..." aria-label="Pergunte à Aura" />
            <button aria-label="Enviar"><Icon name="send" size={18} /></button></label>
        </EcCard>

        <EcCalendar title="Seu calendário" />

        <EcCard className="ec-goal">
          <span className="ec-tile lg"><Icon name="target" size={24} /><i className="dot" /></span>
          <div className="ec-rb"><b>{d.metas.titulo}</b><small>{d.metas.sub}</small>
            <div className="ec-bar"><i style={{ width: `${d.metas.pct}%` }} /></div></div>
          <span className="ec-pct">{d.metas.pct}%</span><Icon name="right" size={16} />
        </EcCard>

        <EcCard className="ec-boy">
          <img src={IMG.boy} alt="" className="px" />
          <div className="ec-bubble">Estudo hoje,<br />conquisto amanhã!<img src={IMG.logoSmall} alt="" width={20} height={20} /></div>
        </EcCard>
      </>}
    >
      <EcHero
        title={`Olá, ${first}!`} sub="Que bom te ver por aqui!"
        text="O conhecimento é a chave para grandes conquistas. Continue firme!"
        cta="Explorar a Aura IA" href="/app/aura" quote="Grandes sonhos começam com pequenos passos."
      />

      <div className="ec-kpis">{d.kpis.map((k, i) => (
        <EcCard key={k.label} className="ec-kpi">
          <span className={`ec-kic k${i}`}><Icon name={KPI_ICONS[i % 4]} size={24} fill={i === 2} /></span>
          <div className="ec-rb">
            <small>{k.label}</small>
            <b>{status === 'loading' ? '–' : k.value}{k.of ? <em>/ {String(k.of).replace(/^[\s/]+/, '')}</em> : null}</b>
            {k.pct != null && <div className="ec-bar"><i style={{ width: `${k.pct}%` }} /></div>}
            {k.trend && <span className="ec-up">↑ {String(k.trend).replace(/^[↑▲+\s]+/, '')}</span>}
          </div>
          {k.of ? <Icon name="right" size={16} /> : null}
        </EcCard>))}
      </div>

      <div className="ec-cols">
        <div className="ec-col">
          <EcCard title="Minhas disciplinas" link="Ver todas" href="/app/dashboard/aluno/aulas">
            <EcList status={status} kind="subject" items={d.disciplinas} empty="Nenhuma disciplina" emptyText="Suas disciplinas aparecem aqui quando você for matriculado." onRetry={retry} />
          </EcCard>
          <EcCard title="Tarefas recentes" link="Ver todas" href="/app/dashboard/aluno/atividades">
            <EcList status={status} kind="task" items={d.tarefas} empty="Nenhuma atividade" emptyText="Você está em dia. Novas tarefas aparecem aqui." onRetry={retry} />
          </EcCard>
        </div>
        <div className="ec-col">
          <EcCard title="Próximas aulas" link="Ver todas" href="/app/dashboard/aluno/aulas">
            <EcList status={status} kind="aula" items={d.aulas} empty="Nenhuma aula agendada" emptyText="Quando houver uma aula marcada, ela aparece aqui." onRetry={retry} />
          </EcCard>
          <EcCard className="ec-well">
            <div className="ec-well-art" aria-hidden />
            <h3>Você está indo muito bem!</h3>
            <p>Sua dedicação hoje constrói<br />o seu futuro amanhã.</p>
            <a className="ec-btn wide" href="/app/dashboard/aluno/aulas">Continuar estudando <Icon name="arrow" size={16} /></a>
          </EcCard>
        </div>
      </div>
    </EcShell>
  );
}
