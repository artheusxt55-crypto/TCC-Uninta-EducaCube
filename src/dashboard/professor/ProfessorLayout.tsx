import { LayoutDashboard, Users, User } from "lucide-react";
import { auth } from "../../lib/firebase";
import Shell, { type ItemMenu } from "../Shell";
import { ProfessorDados } from "./ProfessorDados";
import { ROTA } from "./rotas";

const ITENS: ItemMenu[] = [
  { to: ROTA.inicio, rotulo: "Início", icone: LayoutDashboard, fim: true },
  { to: ROTA.turmas, rotulo: "Turmas", icone: Users },
  { to: ROTA.perfil, rotulo: "Perfil", icone: User },
];

export default function ProfessorLayout() {
  const u = auth.currentUser;
  return (
    <ProfessorDados>
      <Shell papel="professor" itens={ITENS} nome={u?.displayName ?? ""} email={u?.email ?? ""} />
    </ProfessorDados>
  );
}
