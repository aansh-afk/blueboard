import { useEffect, useMemo, useState } from "react";
import { getResponse, listResponses, type ResponseDetail, type ResponseSummary } from "../api/convexHttp";
import { answersToMarkdown, downloadFile, toIsoDate } from "../lib";

export function ResponsesPage() {
  const [items, setItems] = useState<Array<ResponseSummary>>([]);
  const [selected, setSelected] = useState<ResponseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function run() {
      try {
        setLoading(true);
        const data = await listResponses();
        if (!active) return;
        setItems(data);
        if (data[0]) {
          const detail = await getResponse(data[0]._id);
          if (!active) return;
          setSelected(detail);
        }
      } catch {
        if (!active) return;
        setError("Could not load responses. Check your Convex HTTP URL and try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void run();
    return () => {
      active = false;
    };
  }, []);

  const formattedCount = useMemo(() => items.length.toString(), [items.length]);

  return (
    <main className="page-shell">
      <section className="hero-terminal">
        <div className="terminal-chrome">
          <span className="dot red" />
          <span className="dot amber" />
          <span className="dot green" />
          <p>vvg - response-viewer.tsx</p>
        </div>
        <p className="hero-command">&gt; open client_responses</p>
        <h1>Responses Dashboard</h1>
        <p className="hero-subtitle">View submissions and export them in one click.</p>
        <div className="hero-accent" />
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <p className="metric-value">{formattedCount}</p>
          <p className="metric-label">TOTAL SUBMISSIONS</p>
        </article>
        <article className="metric-card">
          <p className="metric-value">JSON</p>
          <p className="metric-label">EXPORT FORMAT</p>
        </article>
        <article className="metric-card">
          <p className="metric-value">MD</p>
          <p className="metric-label">EXPORT FORMAT</p>
        </article>
        <article className="metric-card">
          <p className="metric-value">Live</p>
          <p className="metric-label">CONVEX SOURCE</p>
        </article>
      </section>

      {loading ? <p className="status">Loading responses...</p> : null}
      {error ? <p className="status error">{error}</p> : null}

      <div className="responses-layout">
        <section className="content-card">
          <p className="label">// SUBMISSIONS</p>
          <div className="stack">
            {items.map((item) => (
              <button
                key={item._id}
                type="button"
                className="response-item"
                onClick={async () => {
                  const detail = await getResponse(item._id);
                  setSelected(detail);
                }}
              >
                <strong>{item.clientName || "Unnamed client"}</strong>
                <span>{item.contactRole || "No role provided"}</span>
                <span>{toIsoDate(item.submittedAt)}</span>
              </button>
            ))}
            {items.length === 0 && !loading ? <p className="status">No submissions yet.</p> : null}
          </div>
        </section>

        <section className="content-card">
          <p className="label">// DETAILS</p>
          {!selected ? (
            <p className="status">Select a submission to view details.</p>
          ) : (
            <>
              <div className="field-grid two">
                <div className="preview-box">
                  <p className="preview-label">Client</p>
                  <p>{selected.clientName || "(empty)"}</p>
                </div>
                <div className="preview-box">
                  <p className="preview-label">Submitted</p>
                  <p>{toIsoDate(selected.submittedAt)}</p>
                </div>
              </div>

              <div className="preview-scroll">
                {Object.entries(selected.answers).map(([key, value]) => (
                  <div key={key} className="preview-row">
                    <p className="preview-label">{key}</p>
                    <p>
                      {Array.isArray(value)
                        ? value.join(", ") || "(none)"
                        : value === null || value === ""
                          ? "(empty)"
                          : String(value)}
                    </p>
                  </div>
                ))}
              </div>

              <section className="actions-row">
                <button
                  type="button"
                  onClick={() =>
                    downloadFile(
                      `response-${selected._id}.json`,
                      JSON.stringify(selected, null, 2),
                      "application/json",
                    )
                  }
                >
                  Download JSON
                </button>
                <button
                  type="button"
                  onClick={() =>
                    downloadFile(
                      `response-${selected._id}.md`,
                      answersToMarkdown(
                        selected.answers,
                        `VVG Client Response - ${selected.clientName || "Unknown"}`,
                        selected.submittedAt,
                      ),
                      "text/markdown",
                    )
                  }
                >
                  Download Markdown
                </button>
              </section>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
