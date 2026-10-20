import { Navigate, Route, Routes } from "react-router-dom";
import AlunoLayout from "../dashboard/aluno/AlunoLayout";
import Inicio from "../dashboard/aluno/Inicio";
import Atividades from "../dashboard/aluno/Atividades";
import AtividadeDetalhe from "../dashboard/aluno/AtividadeDetalhe";
import Disciplinas from "../dashboard/aluno/Disciplinas";
import Progresso from "../dashboard/aluno/Progresso";
import Agenda from "../dashboard/aluno/Agenda";
import Perfil from "../dashboard/aluno/Perfil";

/* Rota-mãe: /app/dashboard/aluno/*  (a guarda de papel fica no <ProtectedRoute papel="aluno"> do App). */
export default function DashboardAluno() {
  return (
    <Routes>
      <Route element={<AlunoLayout />}>
        <Route index element={<Inicio />} />
        <Route path="atividades" element={<Atividades />} />
        <Route path="atividades/:id" element={<AtividadeDetalhe />} />
        <Route path="disciplinas" element={<Disciplinas />} />
        <Route path="progresso" element={<Progresso />} />
        <Route path="agenda" element={<Agenda />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="*" element={<Navigate to="/app/dashboard/aluno" replace />} />
      </Route>
    </Routes>
  );
}
