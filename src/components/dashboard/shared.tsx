import { useEffect, useState, type ReactNode } from 'react';
import type { Status, Item } from '../mocks/dashboardMocks';
import '../../styles/Dashboard shared.css';

export interface NavItem { label: string; icon: string; badge?: number; to: string; isExit?: boolean }

export function Shell({ nav, active, user, role, searchPlaceholder, quote, children, aside }: {
  nav: NavItem[]; active: string; user: string; role: string; searchPlaceholder: string;
  quote: string; children: ReactNode; aside: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const exit = nav.find((n) => n.isExit);
  return (
    <div className="dsh">
      <aside className={`dsh-side ${open ? 'is-open' : ''}`} aria-label="Navegação">
        <div className="dsh-logo"><span className="dsh-cube">◈</span><div><b>Educa<em>Cube</em></b><small>Educação que transforma</small></div></div>
        <nav>{nav.filter((n) => !n.isExit).map((n) => (
          <a key={n.label} href={n.to} className={n.label === active ? 'on' : ''} onClick={() => setOpen(false)}>
            <span aria-hidden>{n.icon}</span>{n.label}{n.badge ? <i className="dsh-badge">{n.badge}</i> : null}
          </a>))}</nav>
        <div className="dsh-quote"><span className="dsh-mascot" aria-hidden>🦉</span><p>{quote}</p><div className="dsh-bar"><i style={{ width: '30%' }} /></div></div>
        {exit && <a href={exit.to} className="dsh-exit"><span aria-hidden>{exit.icon}</span>{exit.label}</a>}
        <div className="dsh-ver">◈ <span>EducaCube<br />v1.0.0</span></div>
      </aside>
      {open && <button className="dsh-scrim" aria-label="Fechar menu" onClick={() => setOpen(false)} />}
      <div className="dsh-main">
        <header className="dsh-head">
          <button className="dsh-burger" aria-label="Abrir menu" onClick={() => setOpen(true)}>☰</button>
          <label className="dsh-search"><span aria-hidden>⌕</span><input placeholder={searchPlaceholder} /></label>
          <button className="dsh-ico" aria-label="Notificações">🔔<i className="dsh-dot" /></button>
          <button className="dsh-ico dsh-hide-sm" aria-label="Tema">☾</button>
          <div className="dsh-user"><span className="dsh-avatar" aria-hidden>🧑</span><div><b>{user}</b><small>{role}</small></div><span aria-hidden>⌄</span></div>
        </header>
        <div className="dsh-grid"><div className="dsh-col">{children}</div><div className="dsh-aside">{aside}</div></div>
      </div>
    </div>
  );
}

export const Card = ({ title, link, children, className = '' }: { title?: string; link?: string; children: ReactNode; className?: string }) => (
  <section className={`dsh-card ${className}`}>
    {title && <div className="dsh-card-h"><h2>{title}</h2>{link && <a href="#">{link} →</a>}</div>}
    {children}
  </section>
);

const slug = (v: string) => v.normalize('NFD').replace(/[\u0300-\u036f\s]/g, '').toLowerCase();
export const Pill = ({ v }: { v?: string }) => (v ? <span className={`dsh-pill p-${slug(v)}`}>{v}</span> : null);

export const Row = ({ it, pct }: { it: Item; pct?: boolean }) => (
  <a href="#" className="dsh-row">
    <span className="dsh-tile" style={{ background: it.color }} aria-hidden>{it.icon ?? '▣'}</span>
    <div className="dsh-row-t"><b>{it.title}</b><small>{it.sub}</small>
      {pct && it.pct != null && <div className="dsh-bar"><i style={{ width: `${it.pct}%`, background: it.color }} /></div>}</div>
    {pct && it.pct != null ? <span className="dsh-num">{it.pct}%</span> : <Pill v={it.pill} />}
  </a>
);

export function StateBox({ status, empty, emptyText, onRetry }: { status: Status | 'empty'; empty?: string; emptyText?: string; onRetry?: () => void }) {
  if (status === 'loading') return <div className="dsh-skel" role="status" aria-label="Carregando"><i /><i /><i /></div>;
  if (status === 'error') return <div className="dsh-state" role="alert"><b>Não foi possível carregar</b><small>Verifique sua conexão e tente de novo.</small>{onRetry && <div><button onClick={onRetry}>Tentar novamente</button></div>}</div>;
  return <div className="dsh-state"><b>{empty}</b><small>{emptyText}</small></div>;
}

/** Lista com os 4 estados: loading, error, vazio e dados. */
export function List({ status, items, pct, empty, emptyText, onRetry }: { status: Status; items: Item[]; pct?: boolean; empty: string; emptyText: string; onRetry?: () => void }) {
  if (status !== 'ready') return <StateBox status={status} onRetry={onRetry} />;
  if (!items.length) return <StateBox status="empty" empty={empty} emptyText={emptyText} />;
  return <>{items.map((it) => <Row key={it.id} it={it} pct={pct} />)}</>;
}

const dias = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
export function Calendar({ title }: { title: string }) {
  const cells = [...Array(2).fill(null), ...Array.from({ length: 30 }, (_, i) => i + 1)]; // 1/set/2026 = terça
  return (
    <Card title={title} link="Ver completo">
      <div className="dsh-cal-h"><span>‹</span><b>Setembro 2026</b><span>›</span></div>
      <div className="dsh-cal">{dias.map((d, i) => <em key={i}>{d}</em>)}
        {cells.map((c, i) => <span key={i} className={c === 22 ? 'today' : ''}>{c}</span>)}</div>
    </Card>
  );
}

export const AuraCard = ({ children }: { children?: ReactNode }) => (
  <Card className="dsh-aura">
    <div className="dsh-aura-h"><span className="dsh-mascot" aria-hidden>🦉</span><div><b>Aura IA <i className="dsh-beta">Beta</i></b><small>Sua assistente inteligente de estudos</small></div></div>
    {children}
  </Card>
);

/** Hook de dados: troque o corpo por fetch real depois. */
export function useMockData<T>(data: T) {
  const [state, set] = useState<{ status: Status; data?: T }>({ status: 'loading' });
  const [n, setN] = useState(0);
  useEffect(() => { set({ status: 'loading' }); const t = setTimeout(() => set({ status: 'ready', data }), 500); return () => clearTimeout(t); }, [n]);
  return { ...state, retry: () => setN((x) => x + 1) };
}
