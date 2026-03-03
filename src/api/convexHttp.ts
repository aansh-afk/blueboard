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

const baseUrl = import.meta.env.VITE_CONVEX_HTTP_URL;

if (!baseUrl) {
  throw new Error("Missing VITE_CONVEX_HTTP_URL. Add it in your Vercel environment settings.");
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
  const response = await fetch(`${baseUrl}/api/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return parseJson<{ id: string }>(response);
}

export async function listResponses(): Promise<Array<ResponseSummary>> {
  const response = await fetch(`${baseUrl}/api/responses`);
  return parseJson<Array<ResponseSummary>>(response);
}

export async function getResponse(id: string): Promise<ResponseDetail> {
  const response = await fetch(`${baseUrl}/api/response?id=${encodeURIComponent(id)}`);
  return parseJson<ResponseDetail>(response);
}
