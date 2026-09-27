import { BrowserRouter, Routes, Route } from "react-router-dom";

import AuraAI from "./pages/AuraAI";
import LabPage from "./pages/LabPage";
import LoginPage from "./pages/LoginPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Página de login */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/" element={<LoginPage />} />

        {/* AURA protegida por autenticação */}
        <Route
          path="/aura"
          element={
            <ProtectedRoute>
              <AuraAI />
            </ProtectedRoute>
          }
        />

        <Route
          path="/aura/"
          element={
            <ProtectedRoute>
              <AuraAI />
            </ProtectedRoute>
          }
        />

        {/* Demais páginas do EducaCube */}
        <Route path="/*" element={<LabPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
