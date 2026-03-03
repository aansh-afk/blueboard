import { Link, Navigate, Route, Routes } from "react-router-dom";
import { QuestionnairePage } from "./pages/QuestionnairePage";
import { ResponsesPage } from "./pages/ResponsesPage";

export function App() {
  return (
    <div>
      <header className="topbar">
        <p className="topbar-left">VVG</p>
        <p className="topbar-center">// CLIENT ONBOARDING PORTAL</p>
        <nav className="topbar-nav">
          <Link to="/">Questionnaire</Link>
          <Link to="/responses">Responses</Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<QuestionnairePage />} />
        <Route path="/responses" element={<ResponsesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
