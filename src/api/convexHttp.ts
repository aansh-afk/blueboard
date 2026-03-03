import type { AnswersMap } from "../types";

export type ResponseSummary = {
  _id: string;
  _creationTime: number;
  clientName: string;
  contactRole: string;
  contactInfo: string;
  submittedAt: number;
};

export type ResponseDetail = ResponseSummary & {
  answers: AnswersMap;
};

function normalizeBaseUrl(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url);
    return parsed.origin;
  } catch {
    return undefined;
  }
}

function inferHttpSiteUrl(convexUrl: string | undefined): string | undefined {
  const normalized = normalizeBaseUrl(convexUrl);
  if (!normalized) {
    return undefined;
  }

  const parsed = new URL(normalized);
  if (parsed.hostname.endsWith(".convex.cloud")) {
    parsed.hostname = parsed.hostname.replace(/\.convex\.cloud$/, ".convex.site");
  }
  return parsed.origin;
}

const baseUrl =
  normalizeBaseUrl(import.meta.env.VITE_CONVEX_HTTP_URL as string | undefined) ??
  normalizeBaseUrl(import.meta.env.VITE_CONVEX_SITE_URL as string | undefined) ??
  inferHttpSiteUrl(import.meta.env.VITE_CONVEX_URL as string | undefined);

export function isConvexConfigured(): boolean {
  return Boolean(baseUrl);
}

function getBaseUrl(): string {
  if (!baseUrl) {
    throw new Error(
      "Missing Convex URL. Set VITE_CONVEX_HTTP_URL (or VITE_CONVEX_SITE_URL) in .env.local and Vercel.",
    );
  }
  return baseUrl;
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Request failed");
  }
  return (await response.json()) as T;
}

export async function submitQuestionnaire(payload: {
  clientName: string;
  contactRole: string;
  contactInfo: string;
  answers: AnswersMap;
}): Promise<{ id: string }> {
  const response = await fetch(`${getBaseUrl()}/api/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<{ id: string }>(response);
}

export async function listResponses(): Promise<Array<ResponseSummary>> {
  const response = await fetch(`${getBaseUrl()}/api/responses`);
  return parseJson<Array<ResponseSummary>>(response);
}

export async function getResponse(id: string): Promise<ResponseDetail> {
  const response = await fetch(`${getBaseUrl()}/api/response?id=${encodeURIComponent(id)}`);
  return parseJson<ResponseDetail>(response);
}
