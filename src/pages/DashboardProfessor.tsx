import { Navigate, Route, Routes } from "react-router-dom";
import ProfessorLayout from "../dashboard/professor/ProfessorLayout";
import Inicio from "../dashboard/professor/Inicio";
import Turmas from "../dashboard/professor/Turmas";
import TurmaDetalhe from "../dashboard/professor/TurmaDetalhe";
import AtividadeCorrecao from "../dashboard/professor/AtividadeCorrecao";
import Perfil from "../dashboard/professor/Perfil";

/* Rota-mãe: /app/dashboard/professor/*  (a guarda de papel fica no <ProtectedRoute papel="professor"> do App). */
export default function DashboardProfessor() {
  return (
    <Routes>
      <Route element={<ProfessorLayout />}>
        <Route index element={<Inicio />} />
        <Route path="turmas" element={<Turmas />} />
        <Route path="turmas/:id" element={<TurmaDetalhe />} />
        <Route path="turmas/:turmaId/atividades/:id" element={<AtividadeCorrecao />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="*" element={<Navigate to="/app/dashboard/professor" replace />} />
      </Route>
    </Routes>
  );
}
