import type { AnswersMap } from "./types";

export function toIsoDate(timestamp: number): string {
  return new Date(timestamp).toISOString().slice(0, 10);
}

export function answersToMarkdown(answers: AnswersMap, title: string, submittedAt: number): string {
  const lines: Array<string> = [
    `# ${title}`,
    "",
    `Submitted: ${new Date(submittedAt).toISOString()}`,
    "",
  ];

  for (const [key, value] of Object.entries(answers)) {
    if (Array.isArray(value)) {
      lines.push(`- **${key}:** ${value.length ? value.join(", ") : "(none)"}`);
      continue;
    }
    lines.push(`- **${key}:** ${value === null || value === "" ? "(empty)" : String(value)}`);
  }

  return lines.join("\n");
}

export function downloadFile(filename: string, content: string, type: string): void {
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
