const form = document.getElementById("questionnaireForm");
const fieldsCountEl = document.getElementById("fieldsCount");
const checksCountEl = document.getElementById("checksCount");
const completionEl = document.getElementById("completion");
const todayDateEl = document.getElementById("todayDate");

const saveDraftButton = document.getElementById("saveDraft");
const exportMarkdownButton = document.getElementById("exportMarkdown");
const printButton = document.getElementById("printForm");

const inputs = Array.from(form.querySelectorAll("input, textarea"));

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

function download(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function normalizeLabelForMarkdown(labelText) {
  return labelText
    .replace(/\s+/g, " ")
    .replace(/\s*\*\s*$/, "")
    .trim();
}

function updateMetrics() {
  let filled = 0;
  let checked = 0;

  for (const input of inputs) {
    if (input.type === "checkbox") {
      if (input.checked) {
        checked += 1;
      }
      continue;
    }

    if (input.value.trim() !== "") {
      filled += 1;
    }
  }

  const totalTrackable = inputs.length;
  const completion = Math.round(((filled + checked) / totalTrackable) * 100);

  fieldsCountEl.textContent = String(filled);
  checksCountEl.textContent = String(checked);
  completionEl.textContent = `${Number.isFinite(completion) ? completion : 0}%`;
}

function formToJson() {
  const data = {};
  const checkboxBuckets = {};

  for (const input of inputs) {
    if (input.type === "checkbox") {
      if (!checkboxBuckets[input.name]) {
        checkboxBuckets[input.name] = [];
      }
      if (input.checked) {
        checkboxBuckets[input.name].push(input.value || true);
      }
      continue;
    }

    data[input.name] = input.value.trim();
  }

  for (const [key, value] of Object.entries(checkboxBuckets)) {
    data[key] = value;
  }

  return data;
}

function formToMarkdown() {
  const lines = [
    "# VVG Client Discovery Questionnaire - Response",
    "",
    `Date: ${toIsoDate(new Date())}`,
    "",
  ];

  const visitedNames = new Set();
  const labels = Array.from(form.querySelectorAll("label"));

  for (const label of labels) {
    const input = label.querySelector("input, textarea");
    if (!input) {
      continue;
    }

    if (visitedNames.has(input.name)) {
      continue;
    }

    const labelText = normalizeLabelForMarkdown(label.firstChild?.textContent || input.name);

    if (input.type === "checkbox") {
      const matching = form.querySelectorAll(`input[type=\"checkbox\"][name=\"${input.name}\"]`);
      const selected = Array.from(matching)
        .filter((item) => item.checked)
        .map((item) => item.value);
      lines.push(`- **${labelText || input.name}:** ${selected.length ? selected.join(", ") : "(none)"}`);
      visitedNames.add(input.name);
      continue;
    }

    lines.push(`- **${labelText || input.name}:** ${input.value.trim() || "(empty)"}`);
    visitedNames.add(input.name);
  }

  return lines.join("\n");
}

todayDateEl.textContent = toIsoDate(new Date());

inputs.forEach((input) => {
  input.addEventListener("input", updateMetrics);
  input.addEventListener("change", updateMetrics);
});

saveDraftButton.addEventListener("click", () => {
  const json = JSON.stringify(formToJson(), null, 2);
  download(`vvg-questionnaire-${toIsoDate(new Date())}.json`, json, "application/json");
});

exportMarkdownButton.addEventListener("click", () => {
  const md = formToMarkdown();
  download(`vvg-questionnaire-${toIsoDate(new Date())}.md`, md, "text/markdown");
});

printButton.addEventListener("click", () => {
  window.print();
});

updateMetrics();
