import { useEffect, useMemo, useState } from "react";
import { sections } from "../questionnaire";
import { submitQuestionnaire } from "../api/convexHttp";
import type { AnswerValue, AnswersMap, QuestionField } from "../types";

const STORAGE_KEY = "vvg-questionnaire-progress-v2";

type QuestionStep = {
  sectionId: string;
  sectionTitle: string;
  sectionHelper: string;
  field: QuestionField;
};

const questionSteps: Array<QuestionStep> = sections.flatMap((section) =>
  section.fields.map((field) => ({
    sectionId: section.id,
    sectionTitle: section.title,
    sectionHelper: section.helper,
    field,
  })),
);

const sectionStartIndex: Record<string, number> = {};
for (let i = 0; i < questionSteps.length; i += 1) {
  const step = questionSteps[i];
  if (sectionStartIndex[step.sectionId] === undefined) {
    sectionStartIndex[step.sectionId] = i;
  }
}

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
  const [answers, setAnswers] = useState<AnswersMap>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return createInitialAnswers();
      }
      const parsed = JSON.parse(saved) as { answers?: AnswersMap };
      return { ...createInitialAnswers(), ...(parsed.answers ?? {}) };
    } catch {
      return createInitialAnswers();
    }
  });
  const [activeIndex, setActiveIndex] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return 0;
      }
      const parsed = JSON.parse(saved) as { activeIndex?: number };
      const safeIndex = parsed.activeIndex ?? 0;
      return Math.max(0, Math.min(safeIndex, questionSteps.length - 1));
    } catch {
      return 0;
    }
  });
  const [showIntro, setShowIntro] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) {
        return true;
      }
      const parsed = JSON.parse(saved) as { showIntro?: boolean };
      return parsed.showIntro ?? false;
    } catch {
      return true;
    }
  });
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

  const current = questionSteps[activeIndex];
  const isLastStep = activeIndex === questionSteps.length - 1;

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        answers,
        activeIndex,
        showIntro,
      }),
    );
  }, [answers, activeIndex, showIntro]);

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
      localStorage.removeItem(STORAGE_KEY);
    } catch (submitError) {
      console.error(submitError);
      setError("Could not submit right now. Please try again in a minute.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page-shell">
      {showIntro ? (
        <>
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
            <p className="hero-subtitle">We will ask one thing at a time. Takes about 8-12 minutes.</p>
            <div className="hero-accent" />
          </section>

          <section className="welcome-card">
            <p className="label">// BEFORE WE START</p>
            <h3>Quick and clear process.</h3>
            <p>
              1) You answer this form. 2) We review it and send your project brief within 24 hours.
              3) We confirm timeline and kickoff. If any question feels unclear, skip it and continue.
            </p>
            <section className="actions-inline top-gap">
              <button type="button" className="btn-primary" onClick={() => setShowIntro(false)}>
                Start Questions
              </button>
            </section>
          </section>
        </>
      ) : null}

      {submittedId ? (
        <section className="content-card">
          <p className="label">// SUBMITTED</p>
          <h3>Thank you. We have your responses.</h3>
          <p className="section-helper">Reference ID: {submittedId}</p>
          <section className="actions-inline top-gap">
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setSubmittedId(null);
                setShowIntro(true);
                setAnswers(createInitialAnswers());
                setActiveIndex(0);
              }}
            >
              Start Another Response
            </button>
          </section>
        </section>
      ) : null}

      {!showIntro && !submittedId ? (
        <>
          <section className="content-card progress-card">
            <div className="progress-meta">
              <p className="label">// STEP {activeIndex + 1} OF {questionSteps.length}</p>
              <p className="micro-text">Auto-saved draft enabled</p>
            </div>
            <p className="section-helper compact">{current.sectionTitle} - {current.sectionHelper}</p>
            <section className="progress-bar-wrap" aria-label="progress">
              <div className="progress-bar" style={{ width: `${completion}%` }} />
            </section>
            <div className="field-grid two jump-grid">
              <label>
                Jump to section
                <select
                  value={current.sectionId}
                  onChange={(event) => {
                    const nextSectionId = event.target.value;
                    setActiveIndex(sectionStartIndex[nextSectionId] ?? 0);
                  }}
                >
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      [{section.id}] {section.title}
                    </option>
                  ))}
                </select>
              </label>
              <div className="help-tip-box">
                <p className="preview-label">Need help?</p>
                <p className="micro-text">You can skip any question and continue.</p>
              </div>
            </div>
          </section>

          <section className="content-card question-animate" key={`${current.sectionId}-${current.field.key}`}>
            <div className="section-divider">
              <span>[{current.sectionId}]</span>
              <h2>{current.sectionTitle}</h2>
            </div>
            <label className="single-question">
              <span className="single-question-label">{current.field.label}</span>
              {renderInput(current.field, answers[current.field.key], (newValue) =>
                setAnswers((prev) => ({ ...prev, [current.field.key]: newValue })),
              )}
            </label>
            <p className="micro-text">Tip: short bullet-style answers are perfectly fine.</p>

            <section className="actions-inline">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                disabled={activeIndex === 0}
              >
                Back
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() =>
                  setAnswers((prev) => {
                    const updated = { ...prev };
                    updated[current.field.key] = current.field.type === "checkbox-group" ? [] : "";
                    return updated;
                  })
                }
              >
                Clear
              </button>

              {isLastStep ? (
                <button type="button" className="btn-primary" disabled={submitting} onClick={onSubmit}>
                  {submitting ? "Submitting..." : "Submit Questionnaire"}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setActiveIndex((prev) => Math.min(questionSteps.length - 1, prev + 1))}
                >
                  Save and Continue
                </button>
              )}
            </section>
          </section>
        </>
      ) : null}

      {error ? <p className="status error">{error}</p> : null}
      {submittedId ? <p className="status ok">Submitted successfully.</p> : null}
    </main>
  );
}
