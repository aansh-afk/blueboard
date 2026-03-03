import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.isContentEditable || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement) {
    return true;
  }

  if (target instanceof HTMLInputElement) {
    return !["button", "checkbox", "color", "file", "radio", "range", "reset", "submit"].includes(
      target.type,
    );
  }

  return false;
}

function isShortcutBlockedByTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.closest(".picker-menu")) {
    return true;
  }

  if (target instanceof HTMLButtonElement || target instanceof HTMLAnchorElement) {
    return true;
  }

  if (target instanceof HTMLInputElement) {
    return ["checkbox", "radio"].includes(target.type);
  }

  return false;
}

function renderInput(
  field: QuestionField,
  value: AnswerValue,
  onChange: (newValue: AnswerValue) => void,
): JSX.Element {
  if (field.type === "select") {
    return (
      <select value={typeof value === "string" ? value : ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select an option</option>
        {(field.options ?? []).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

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
  const [sectionMenuOpen, setSectionMenuOpen] = useState(false);
  const sectionMenuRef = useRef<HTMLDivElement | null>(null);

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

  const onSubmit = useCallback(async (): Promise<void> => {
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
  }, [answers]);

  const goToPreviousStep = useCallback(() => {
    setActiveIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const goToNextStep = useCallback(() => {
    setActiveIndex((prev) => Math.min(questionSteps.length - 1, prev + 1));
  }, []);

  const clearCurrentAnswer = useCallback(() => {
    setAnswers((prev) => {
      const updated = { ...prev };
      updated[current.field.key] = current.field.type === "checkbox-group" ? [] : "";
      return updated;
    });
  }, [current.field.key, current.field.type]);

  const continueFromCurrentStep = useCallback(() => {
    if (submitting) {
      return;
    }
    if (isLastStep) {
      void onSubmit();
      return;
    }
    goToNextStep();
  }, [goToNextStep, isLastStep, onSubmit, submitting]);

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent): void {
      if (!sectionMenuRef.current) {
        return;
      }
      if (!sectionMenuRef.current.contains(event.target as Node)) {
        setSectionMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        setSectionMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setSectionMenuOpen(false);
  }, [activeIndex]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent): void {
      if (event.defaultPrevented || event.repeat || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      const isEnter = event.key === "Enter";
      const isSpace = event.key === " " || event.key === "Spacebar";
      if (!isEnter && !isSpace) {
        return;
      }

      if (isShortcutBlockedByTarget(event.target)) {
        return;
      }

      if (isEnter && event.target instanceof HTMLTextAreaElement && event.shiftKey) {
        return;
      }

      if (isSpace && isTextEntryTarget(event.target)) {
        return;
      }

      if (showIntro) {
        event.preventDefault();
        setShowIntro(false);
        return;
      }

      if (submittedId || sectionMenuOpen) {
        return;
      }

      event.preventDefault();
      continueFromCurrentStep();
    }

    document.addEventListener("keydown", handleShortcut);
    return () => {
      document.removeEventListener("keydown", handleShortcut);
    };
  }, [continueFromCurrentStep, sectionMenuOpen, showIntro, submittedId]);

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
              <div className="section-picker" ref={sectionMenuRef}>
                <p className="picker-label">Jump to section</p>
                <button
                  type="button"
                  className="picker-trigger"
                  aria-haspopup="listbox"
                  aria-expanded={sectionMenuOpen}
                  onClick={() => setSectionMenuOpen((prev) => !prev)}
                >
                  <span>
                    [{current.sectionId}] {current.sectionTitle}
                  </span>
                  <span className="picker-caret">{sectionMenuOpen ? "▴" : "▾"}</span>
                </button>

                {sectionMenuOpen ? (
                  <ul className="picker-menu" role="listbox" aria-label="Sections">
                    {sections.map((section) => {
                      const isActive = section.id === current.sectionId;
                      return (
                        <li key={section.id}>
                          <button
                            type="button"
                            className={`picker-option${isActive ? " active" : ""}`}
                            onClick={() => {
                              setActiveIndex(sectionStartIndex[section.id] ?? 0);
                              setSectionMenuOpen(false);
                            }}
                          >
                            <span>[{section.id}]</span>
                            <span>{section.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
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
            <p className="micro-text">Shortcut: Enter to continue. Space also continues when not typing.</p>

            <section className="actions-inline">
              <button
                type="button"
                className="btn-secondary"
                onClick={goToPreviousStep}
                disabled={activeIndex === 0}
              >
                Back
              </button>

              <button type="button" className="btn-secondary" onClick={clearCurrentAnswer}>
                Clear
              </button>

              {isLastStep ? (
                <button
                  type="button"
                  className="btn-primary"
                  aria-keyshortcuts="Enter Space"
                  disabled={submitting}
                  onClick={onSubmit}
                >
                  {submitting ? "Submitting..." : "Submit Questionnaire"}
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  aria-keyshortcuts="Enter Space"
                  onClick={continueFromCurrentStep}
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
