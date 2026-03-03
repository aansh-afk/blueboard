import { Link, Navigate, Route, Routes } from "react-router-dom";
import { QuestionnairePage } from "./pages/QuestionnairePage";
import { ResponsesPage } from "./pages/ResponsesPage";
import { isConvexConfigured } from "./api/convexHttp";

export function App() {
  const convexReady = isConvexConfigured();

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

      {!convexReady ? (
        <p className="status error center-banner">
          Convex not configured yet. Add `VITE_CONVEX_HTTP_URL` in Vercel environment variables.
        </p>
      ) : null}

      <Routes>
        <Route path="/" element={<QuestionnairePage />} />
        <Route path="/responses" element={<ResponsesPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
