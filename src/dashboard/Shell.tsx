import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { LogOut, Menu, Sparkles, X, type LucideIcon } from "lucide-react";
import { auth } from "../lib/firebase";
import { nomeDoPapel, type Papel } from "../lib/plataforma";
import "./dashboard.css";

export type ItemMenu = {
  to: string;
  rotulo: string;
  icone: LucideIcon;
  fim?: boolean;
};

type Props = {
  papel: Papel;
  itens: ItemMenu[];
  nome: string;
  email: string;
};

/* Casca dos dashboards: menu lateral no desktop, gaveta no mobile, conteúdo via <Outlet />. */
export default function Shell({ papel, itens, nome, email }: Props) {
  const [aberto, setAberto] = useState(false);
  const { pathname } = useLocation();
  const botaoMenu = useRef<HTMLButtonElement>(null);
  const primeiroLink = useRef<HTMLAnchorElement>(null);
  const conteudo = useRef<HTMLElement>(null);
  const primeiraRota = useRef(true);

  // Trocar de página fecha a gaveta e leva o foco ao conteúdo (leitor de tela anuncia a nova página).
  useEffect(() => {
    setAberto(false);
    if (primeiraRota.current) {
      primeiraRota.current = false;
      return;
    }
    conteudo.current?.focus({ preventScroll: true });
  }, [pathname]);

  useEffect(() => {
    if (!aberto) return;
    primeiroLink.current?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAberto(false);
        botaoMenu.current?.focus();
      }
    };
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  return (
    <div className={`edc-app edc-app-${papel}`}>
      <a className="edc-pular" href="#conteudo">
        Pular para o conteúdo
      </a>

      <header className="edc-barra-topo">
        <button
          ref={botaoMenu}
          type="button"
          className="edc-icone-btn"
          aria-label="Abrir menu"
          aria-expanded={aberto}
          aria-controls="edc-menu"
          onClick={() => setAberto(true)}
        >
          <Menu aria-hidden="true" size={22} />
        </button>
        <span className="edc-marca">
          <span className="edc-marca-cubo" aria-hidden="true" />
          EducaCube
        </span>
        <span className="edc-papel-selo">{nomeDoPapel(papel)}</span>
      </header>

      {aberto ? <button type="button" className="edc-cortina" aria-label="Fechar menu" onClick={() => setAberto(false)} /> : null}

      <aside id="edc-menu" className={`edc-lateral${aberto ? " edc-lateral-aberta" : ""}`} aria-label="Menu do painel">
        <div className="edc-lateral-topo">
          <a className="edc-marca" href="/">
            <span className="edc-marca-cubo" aria-hidden="true" />
            EducaCube
          </a>
          <button type="button" className="edc-icone-btn edc-so-gaveta" aria-label="Fechar menu" onClick={() => setAberto(false)}>
            <X aria-hidden="true" size={22} />
          </button>
        </div>

        <p className="edc-papel-selo edc-papel-lateral">Painel do {nomeDoPapel(papel).toLowerCase()}</p>

        <nav aria-label="Seções do painel" className="edc-nav">
          {itens.map((item, i) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.fim}
              ref={i === 0 ? primeiroLink : undefined}
              className={({ isActive }) => `edc-nav-link${isActive ? " edc-nav-ativo" : ""}`}
            >
              <item.icone aria-hidden="true" size={18} />
              {item.rotulo}
            </NavLink>
          ))}
          <Link className="edc-nav-link edc-nav-aura" to="/aura">
            <Sparkles aria-hidden="true" size={18} />
            Conversar com a AURA
          </Link>
        </nav>

        <div className="edc-lateral-rodape">
          <div className="edc-usuario">
            <span className="edc-avatar" aria-hidden="true">
              {(nome || email || "?").charAt(0).toLocaleUpperCase("pt-BR")}
            </span>
            <span className="edc-usuario-texto">
              <strong>{nome || "Sem nome"}</strong>
              <small>{email}</small>
            </span>
          </div>
          <button type="button" className="edc-btn edc-btn-secundario edc-btn-bloco" onClick={() => void auth.signOut()}>
            <LogOut aria-hidden="true" size={16} /> Sair
          </button>
        </div>
      </aside>

      <main id="conteudo" ref={conteudo} tabIndex={-1} className="edc-conteudo">
        <Outlet />
      </main>
    </div>
  );
}
