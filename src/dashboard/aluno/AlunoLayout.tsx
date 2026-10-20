import { BookOpen, CalendarDays, ClipboardList, LayoutDashboard, TrendingUp, User } from "lucide-react";
import { auth } from "../../lib/firebase";
import Shell, { type ItemMenu } from "../Shell";
import { AlunoDados } from "./AlunoDados";
import { ROTA } from "./rotas";

const ITENS: ItemMenu[] = [
  { to: ROTA.inicio, rotulo: "Início", icone: LayoutDashboard, fim: true },
  { to: ROTA.atividades, rotulo: "Atividades", icone: ClipboardList },
  { to: ROTA.disciplinas, rotulo: "Disciplinas", icone: BookOpen },
  { to: ROTA.progresso, rotulo: "Progresso", icone: TrendingUp },
  { to: ROTA.agenda, rotulo: "Agenda", icone: CalendarDays },
  { to: ROTA.perfil, rotulo: "Perfil", icone: User },
];

export default function AlunoLayout() {
  const u = auth.currentUser;
  return (
    <AlunoDados>
      <Shell papel="aluno" itens={ITENS} nome={u?.displayName ?? ""} email={u?.email ?? ""} />
    </AlunoDados>
  );
}
