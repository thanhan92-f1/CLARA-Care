import api from "@/lib/http-client";

export type ApiHealthRawResponse = {
  status?: string;
  message?: string;
  service?: string;
  detail?: string;
  [key: string]: unknown;
};

export type ApiHealthSnapshot = {
  status: string;
  message: string;
};

function asText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const next = value.trim();
  return next ? next : null;
}

export async function getApiHealth(): Promise<ApiHealthRawResponse> {
  const response = await api.get<ApiHealthRawResponse>("/health");
  return response.data;
}

export function normalizeApiHealth(data: ApiHealthRawResponse): ApiHealthSnapshot {
  const status = asText(data.status) ?? "unknown";
  const message = asText(data.message) ?? asText(data.detail) ?? asText(data.service) ?? "No details";

  return { status, message };
}
