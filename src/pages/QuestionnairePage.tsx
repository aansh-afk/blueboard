import { useMemo, useState } from "react";
import { sections } from "../questionnaire";
import { downloadFile } from "../lib";
import { submitQuestionnaire } from "../api/convexHttp";
import type { AnswerValue, AnswersMap, QuestionField } from "../types";

function createInitialAnswers(): AnswersMap {
  const result: AnswersMap = {};
  for (const section of sections) {
    for (const field of section.fields) {
      result[field.key] = field.type === "checkbox-group" ? [] : "";
    }
  }
  return result;
}

function renderInput(
  field: QuestionField,
  value: AnswerValue,
  onChange: (newValue: AnswerValue) => void,
): JSX.Element {
  if (field.type === "textarea") {
    return (
      <textarea
        rows={4}
        value={typeof value === "string" ? value : ""}
        placeholder={field.placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (field.type === "checkbox-group") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="checks-grid two-col">
        {(field.options ?? []).map((option) => {
          const isChecked = selected.includes(option);
          return (
            <label key={option} className="check-item">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => {
                  if (isChecked) {
                    onChange(selected.filter((entry) => entry !== option));
                  } else {
                    onChange([...selected, option]);
                  }
                }}
              />
              <span>{option}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (field.type === "number") {
    return (
      <input
        type="number"
        min={1}
        max={5}
        value={typeof value === "number" || typeof value === "string" ? value : ""}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  return (
    <input
      type="text"
      value={typeof value === "string" ? value : ""}
      placeholder={field.placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function QuestionnairePage() {
  const [answers, setAnswers] = useState<AnswersMap>(() => createInitialAnswers());
  const [activeIndex, setActiveIndex] = useState(0);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completion = useMemo(() => {
    const values = Object.values(answers);
    const filled = values.filter((value) => {
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return String(value).trim() !== "";
    }).length;
    return Math.round((filled / values.length) * 100);
  }, [answers]);

  const current = sections[activeIndex];

  async function onSubmit(): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      const response = await submitQuestionnaire({
        clientName: String(answers.client_name ?? ""),
        contactRole: String(answers.contact_role ?? ""),
        contactInfo: String(answers.email_phone ?? ""),
        answers,
      });
      setSubmittedId(response.id);
    } catch (submitError) {
      console.error(submitError);
      setError("Could not submit right now. Please try again in a minute.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      <section className="hero-terminal">
        <div className="terminal-chrome">
          <span className="dot red" />
          <span className="dot amber" />
          <span className="dot green" />
          <p>vvg - onboarding-questionnaire.tsx</p>
        </div>
        <p className="hero-command">&gt; start client_onboarding</p>
        <h1>Welcome to VVG</h1>
        <p className="hero-subname">Aansh Naidu - Co-Founder, Vivid Verse Global</p>
        <p className="hero-subtitle">Simple questionnaire, clear plan, faster kickoff.</p>
        <div className="hero-accent" />
      </section>

      <section className="welcome-card">
        <p className="label">// BEFORE WE START</p>
        <h3>Thanks for trusting us with your project.</h3>
        <p>
          This form is intentionally plain and simple. If anything feels unclear, skip it and we will fill
          it together on a call. Once you submit, we send your brief and timeline within 24 hours.
        </p>
      </section>

      <section className="metrics-grid">
        <article className="metric-card">
          <p className="metric-value">{sections.length}</p>
          <p className="metric-label">SECTIONS</p>
        </article>
        <article className="metric-card">
          <p className="metric-value">{activeIndex + 1}</p>
          <p className="metric-label">CURRENT STEP</p>
        </article>
        <article className="metric-card">
          <p className="metric-value">{completion}%</p>
          <p className="metric-label">COMPLETION</p>
        </article>
        <article className="metric-card">
          <p className="metric-value">24h</p>
          <p className="metric-label">BRIEF TURNAROUND</p>
        </article>
      </section>

      <section className="progress-bar-wrap" aria-label="progress">
        <div className="progress-bar" style={{ width: `${completion}%` }} />
      </section>

      <section className="content-card">
        <div className="section-divider">
          <span>[{current.id}]</span>
          <h2>{current.title}</h2>
        </div>
        <p className="section-helper">{current.helper}</p>

        <div className="stack">
          {current.fields.map((field) => (
            <label key={field.key}>
              {field.label}
              {renderInput(field, answers[field.key], (newValue) =>
                setAnswers((prev) => ({ ...prev, [field.key]: newValue })),
              )}
            </label>
          ))}
        </div>

        <section className="actions-row">
          <button type="button" onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}>
            Previous
          </button>
          {activeIndex < sections.length - 1 ? (
            <button
              type="button"
              onClick={() => setActiveIndex((prev) => Math.min(sections.length - 1, prev + 1))}
            >
              Next
            </button>
          ) : (
            <button type="button" disabled={submitting} onClick={onSubmit}>
              {submitting ? "Submitting..." : "Submit Questionnaire"}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              downloadFile(
                "vvg-questionnaire-draft.json",
                JSON.stringify(answers, null, 2),
                "application/json",
              );
            }}
          >
            Download Draft JSON
          </button>
        </section>
      </section>

      {error ? <p className="status error">{error}</p> : null}
      {submittedId ? (
        <p className="status ok">Submitted successfully. Reference ID: {submittedId}</p>
      ) : null}
    </main>
  );
}
