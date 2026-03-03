import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { QuestionnairePage } from "./pages/QuestionnairePage";
import { ResponsesPage } from "./pages/ResponsesPage";

export function App() {
  const location = useLocation();
  const onResponsesPage = location.pathname.startsWith("/responses");

  return (
    <div>
      <header className="topbar">
        <p className="topbar-left">VVG</p>
        <p className="topbar-center">// CLIENT ONBOARDING PORTAL</p>
        {onResponsesPage ? (
          <nav className="topbar-nav">
            <Link to="/">Back to form</Link>
          </nav>
        ) : (
          <p className="topbar-right">// STEP-BY-STEP FORM</p>
        )}
      </header>

      <Routes>
        <Route path="/" element={<QuestionnairePage />} />
        <Route path="/responses" element={<ResponsesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
