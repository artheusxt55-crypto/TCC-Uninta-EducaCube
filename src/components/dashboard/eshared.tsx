/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, type ReactNode } from 'react';
import { StateBox } from './shared';

type SBStatus = React.ComponentProps<typeof StateBox>['status'];

const A = '/assets/dashboard';
export const IMG = {
  logo: `${A}/logo.png`,
  logoSmall: `${A}/logo-small.png`,
  avatar: `${A}/avatar.png`,
  owlSidebar: `${A}/owl-sidebar.png`,
  owlAura: `${A}/owl-aura.png`,
  owlCard: `${A}/owl-card.png`,
  heroScene: `${A}/hero-scene.png`,
  boy: `${A}/mascot-boy.png`,
};

/* ---------- ícones (linha, 24x24) ---------- */
const P = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  book: 'M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z',
  file: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5 M9 13h6 M9 17h6',
  tasks: 'M9 11l3 3L22 4 M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
  clip: 'M9 3h6v3H9z M7 5H6a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-1 M9 12h6 M9 16h4',
  spark: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z M19 3v4 M17 5h4 M5 17v4 M3 19h4',
  library: 'M4 4h4v16H4z M10 4h4v16h-4z M16 6l4 1-3.5 13-4-1z',
  chart: 'M3 3v18h18 M7 15l4-5 3 3 5-7',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M10.3 21a1.9 1.9 0 0 0 3.4 0',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3',
  arrow: 'M5 12h14 M13 6l6 6-6 6',
  right: 'M9 6l6 6-6 6',
  left: 'M15 6l-6 6 6 6',
  down: 'M6 9l6 6 6-6',
  send: 'M22 2 11 13 M22 2l-7 20-4-9-9-4z',
  video: 'M3 7h12v10H3z M15 11l6-3v8l-6-3',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  target: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  check: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M8 12l3 3 5-6',
  out: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  users: 'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2 M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M21 21v-2a4 4 0 0 0-3-3.9 M16 3.1a4 4 0 0 1 0 7.8',
  folder: 'M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  flask: 'M9 3h6 M10 3v6L4 19a2 2 0 0 0 2 3h12a2 2 0 0 0 2-3l-6-10V3',
  tool: 'M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.5 2.5-2.4-.6-.6-2.4z',
  hand: 'M18 11V6a2 2 0 0 0-4 0v5 M14 10V4a2 2 0 0 0-4 0v6 M10 10.5V6a2 2 0 0 0-4 0v8 M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2a8 8 0 0 1-6-2.7L3 16a2 2 0 0 1 3-2.6L8 15',
  pi: 'M5 7h14 M9 7v11 M15 7v9a2 2 0 0 0 2 2',
  lang: 'M5 8l6 6 M4 14l6-6 2-3 M2 5h12 M7 2h1 M22 22l-5-10-5 10 M14 18h6',
  bank: 'M3 21h18 M5 21V10 M9 21V10 M15 21V10 M19 21V10 M3 10l9-6 9 6',
  edit: 'M4 4h16v16H4z M8 9h8 M8 13h5',
  plus: 'M12 5v14 M5 12h14',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M12 2v2 M12 20v2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M2 12h2 M20 12h2 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4',
  cal: 'M4 5h16v16H4z M4 10h16 M9 3v4 M15 3v4',
  checksq: 'M4 4h16v16H4z M8 12l3 3 5-6',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  plusc: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 8v8 M8 12h8',
  upload: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z M14 3v5h5 M12 18v-6 M9 14l3-3 3 3',
  editsq: 'M11 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-6 M18 3l3 3-9 9-4 1 1-4z',
};
export type IconName = keyof typeof P;

export function Icon({ name, size = 20, fill = false }: { name: IconName; size?: number; fill?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill ? 'currentColor' : 'none'} stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false">
      <path d={P[name]} />
    </svg>
  );
}

/* ---------- usuário logado ----------
   Lê o nome da conta logada. Ajuste as chaves abaixo (ou troque por seu AuthContext)
   se o seu login guarda o usuário em outro lugar. */
export function useLoggedUser(fallback = 'Aluno') {
  let full = '';
  try {
    for (const k of ['user', 'usuario', 'currentUser', 'auth']) {
      const raw = localStorage.getItem(k) ?? sessionStorage.getItem(k);
      if (!raw) continue;
      let o: any = raw;
      try { o = JSON.parse(raw); } catch { /* string simples */ }
      const c = typeof o === 'string' ? o
        : o?.nome ?? o?.name ?? o?.full_name ?? o?.displayName ?? o?.user?.nome ?? o?.user?.name;
      if (c) { full = String(c).trim(); break; }
    }
  } catch { /* storage indisponível */ }
  if (!full) full = fallback;
  return { full, first: full.split(/\s+/)[0] };
}

const slug = (s = '') => s.normalize('NFD').replace(/[\u0300-\u036f\s]/g, '').toLowerCase();

/* ---------- Shell ---------- */
export interface EcNavItem { label: string; icon: IconName; to: string; badge?: number }

export function EcShell(props: {
  nav: EcNavItem[]; active: string; userName: string; role: string; searchPlaceholder: string;
  mascotText: ReactNode; pageClass?: string; aside: ReactNode; children: ReactNode;
  themeToggle?: boolean; mascotImg?: string; footerLogo?: string; brandLogo?: string;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <div className={`ec-app ${props.pageClass ?? ''}`}>
      <aside className="ec-side">
        <a className="ec-brand" href="/">
          <img src={props.brandLogo ?? IMG.logo} alt="" width={44} height={44} />
          <span><b>Educa<i>Cube</i></b><small>Educação que transforma</small></span>
        </a>
        <nav aria-label="Principal" className="ec-nav">
          {props.nav.map((n) => (
            <a key={n.label} href={n.to} className={n.label === props.active ? 'on' : ''} aria-current={n.label === props.active ? 'page' : undefined}>
              <Icon name={n.icon} size={22} /><span>{n.label}</span>
              {n.badge ? <em>{n.badge}</em> : null}
            </a>
          ))}
        </nav>
        <div className="ec-side-bot">
          <div className="ec-mascot">
            <img src={props.mascotImg ?? IMG.owlSidebar} alt="" className="px" />
            <p>{props.mascotText}</p>
            <i className="ec-bar"><i style={{ width: '30%' }} /></i>
          </div>
          <div className="ec-ver"><img src={props.footerLogo ?? IMG.logoSmall} alt="" width={30} height={30} /><span>EducaCube<small>v1.0.0</small></span></div>
        </div>
      </aside>

      <div className="ec-body">
        <header className="ec-top">
          <label className="ec-search"><Icon name="search" size={18} />
            <input placeholder={props.searchPlaceholder} aria-label="Buscar" /></label>
          <div className="ec-top-r">
            <button className="ec-ib" aria-label="Notificações"><Icon name="bell" size={22} /><i className="dot" /></button>
            {props.themeToggle
              ? <div className="ec-toggle" role="group" aria-label="Tema"><button aria-label="Claro"><Icon name="sun" size={18} /></button><button className="on" aria-label="Escuro" aria-pressed="true"><Icon name="moon" size={18} fill /></button></div>
              : <button className="ec-ib" aria-label="Tema"><Icon name="moon" size={22} /></button>}
            <div className="ec-user">
              <button onClick={() => setMenu(!menu)} aria-expanded={menu} aria-haspopup="menu">
                <img src={IMG.avatar} alt="" className="px" />
                <span><b>{props.userName}</b><small>{props.role}</small></span>
                <Icon name="down" size={16} />
              </button>
              {menu && <div className="ec-menu" role="menu"><a role="menuitem" href="/logout"><Icon name="out" size={16} /> Sair</a></div>}
            </div>
          </div>
        </header>
        <main className="ec-main">
          <div className="ec-center">{props.children}</div>
          <aside className="ec-aside">{props.aside}</aside>
        </main>
      </div>
    </div>
  );
}

/* ---------- Card / Hero ---------- */
export function EcCard(p: { title?: string; link?: string; href?: string; className?: string; children: ReactNode }) {
  return (
    <section className={`ec-card ${p.className ?? ''}`}>
      {p.title && <div className="ec-head"><h2>{p.title}</h2>{p.link && <a href={p.href ?? '#'}>{p.link} <Icon name="arrow" size={14} /></a>}</div>}
      {p.children}
    </section>
  );
}

export function EcHero(p: {
  title: string; sub: string; text: string; cta: string; href: string; quote: string;
  art?: string; artWidth?: number; ctaLeft?: IconName; ctaRight?: IconName;
}) {
  return (
    <section className="ec-card ec-hero">
      <div className="ec-hero-art" aria-hidden style={p.art ? { backgroundImage: `url(${p.art})`, width: p.artWidth } : undefined} />
      <div className="ec-hero-txt">
        <h1>{p.title} <span aria-hidden>👋</span></h1>
        <h3>{p.sub}</h3>
        <p>{p.text}</p>
        <a className="ec-btn" href={p.href}>{p.ctaLeft && <Icon name={p.ctaLeft} size={20} />}{p.cta} <Icon name={p.ctaRight ?? 'arrow'} size={16} /></a>
      </div>
      <blockquote className="ec-quote"><p>“{p.quote}”</p><img src={IMG.logoSmall} alt="" width={22} height={22} /></blockquote>
    </section>
  );
}

/* ---------- Lista ---------- */
export interface EcItem { id?: string | number; title: string; sub?: string; pct?: number; pill?: string; [k: string]: unknown }
const CYCLE = ['#4b1fc7', '#c0269f', '#12a394', '#f0a01c'];
const SUBJ: Record<string, { bg: string; ic: IconName }> = {
  matematica: { bg: '#4b1fc7', ic: 'pi' }, portugues: { bg: '#c0269f', ic: 'edit' },
  ingles: { bg: '#12a394', ic: 'lang' }, historia: { bg: '#f0a01c', ic: 'bank' },
};
function theme(title: string, i: number): { bg: string; ic: IconName } {
  const s = slug(title);
  for (const k of Object.keys(SUBJ)) if (s.includes(k)) return SUBJ[k];
  return { bg: CYCLE[i % 4], ic: 'file' };
}
export const Pill = ({ text }: { text?: string }) => (text ? <span className={`ec-pill p-${slug(text)}`}>{text}</span> : null);

export function EcList(p: {
  status: string; items?: readonly unknown[]; kind?: 'subject' | 'aula' | 'task' | 'plain';
  empty?: string; emptyText?: string; onRetry?: () => void;
}) {
  const list = (p.items ?? []) as EcItem[];
  if (p.status !== 'ready' || !list.length)
    return <StateBox status={(p.status === 'ready' ? 'empty' : p.status) as SBStatus} empty={p.empty} emptyText={p.emptyText} onRetry={p.onRetry} />;
  const kind = p.kind ?? 'plain';
  return (
    <div className={`ec-list k-${kind}`}>
      {list.map((it, i) => {
        const t = theme(it.title, i);
        const live = slug(it.pill) === 'aovivo';
        if (kind === 'subject') return (
          <div className="ec-row" key={it.id ?? i}>
            <span className="ec-tile" style={{ background: t.bg }}><Icon name={t.ic} size={24} /></span>
            <div className="ec-rb"><b>{it.title}</b><small>{it.sub}</small>
              <div className="ec-bar"><i style={{ width: `${it.pct ?? 0}%` }} /></div></div>
            <span className="ec-pct">{it.pct ?? 0}%</span>
          </div>);
        return (
          <a className="ec-row" href="#" key={it.id ?? i}>
            <span className="ec-tile" style={{ background: kind === 'aula' && live ? '#6d28f9' : t.bg }}>
              <Icon name={kind === 'aula' && live ? 'video' : t.ic} size={kind === 'task' ? 18 : 22} /></span>
            <div className="ec-rb"><b>{it.title}</b><small>{it.sub}</small>
              {kind === 'plain' && it.pct != null && <div className="ec-bar"><i style={{ width: `${it.pct}%` }} /></div>}</div>
            {kind === 'plain' && it.pct != null ? <span className="ec-pct">{it.pct}%</span> : <Pill text={it.pill} />}
            {kind === 'task' && <Icon name="right" size={16} />}
          </a>);
      })}
    </div>
  );
}

/* ---------- Calendário ---------- */
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
export function EcCalendar({ title = 'Seu calendário', link = true }: { title?: string; link?: boolean }) {
  const today = new Date();
  const [cur, setCur] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const first = cur.getDay();
  const days = new Date(cur.getFullYear(), cur.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const isToday = (d: number) => d === today.getDate() && cur.getMonth() === today.getMonth() && cur.getFullYear() === today.getFullYear();
  const go = (n: number) => setCur(new Date(cur.getFullYear(), cur.getMonth() + n, 1));
  return (
    <EcCard title={title} link={link ? 'Ver completo' : undefined} href="/app/calendario" className="ec-cal">
      <div className="ec-cal-nav">
        <button onClick={() => go(-1)} aria-label="Mês anterior"><Icon name="left" size={16} /></button>
        <span>{MESES[cur.getMonth()]} {cur.getFullYear()}</span>
        <button onClick={() => go(1)} aria-label="Próximo mês"><Icon name="right" size={16} /></button>
      </div>
      <div className="ec-cal-g" role="grid">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((w, i) => <b key={i}>{w}</b>)}
        {cells.map((d, i) => <span key={i} className={d && isToday(d) ? 'today' : ''}>{d}</span>)}
      </div>
    </EcCard>
  );
}

export { useMockData } from './shared';

export function dataExtenso(d = new Date()) {
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}
