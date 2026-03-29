import api from "@/lib/http-client";

export type ResearchTier = "tier1" | "tier2";

export const RESEARCH_UPLOAD_TIMEOUT_MS = 60000;
export const RESEARCH_TIER2_TIMEOUT_MS = 120000;

export type Tier2Citation = {
  title: string;
  source?: string;
  url?: string;
  snippet?: string;
  year?: string;
};

export type Tier2Step = {
  title: string;
  detail?: string;
};

export type ResearchFlowStageStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "warning"
  | "failed"
  | "skipped";

export type ResearchFlowStage = {
  id: string;
  label: string;
  detail?: string;
  status: ResearchFlowStageStatus;
  source: "metadata" | "flow_events" | "local";
};

export type ResearchFlowEvent = {
  id: string;
  stageId: string;
  label: string;
  detail?: string;
  status: ResearchFlowStageStatus;
  timestamp?: string;
};

export type ResearchTier2RoutingHint = {
  role?: string;
  intent?: string;
  confidence?: number;
  emergency?: boolean;
};

export type ResearchTier2DebugMeta = {
  pipeline?: string;
  responseStyle?: string;
  sourceMode?: string;
  stageCount: number;
  flowEventCount: number;
  routing?: ResearchTier2RoutingHint;
};

export type ResearchTier2RawResponse = {
  answer?: string;
  summary?: string;
  message?: string;
  citations?: unknown;
  sources?: unknown;
  steps?: unknown;
  workflow_steps?: unknown;
  plan_steps?: unknown;
  metadata?: unknown;
  flow_events?: unknown;
  events?: unknown;
  [key: string]: unknown;
};

export type ResearchTier2Result = {
  answer: string;
  citations: Tier2Citation[];
  steps: Tier2Step[];
  flowStages: ResearchFlowStage[];
  flowEvents: ResearchFlowEvent[];
  debug: ResearchTier2DebugMeta;
  verificationStatus?: {
    verdict?: string;
    confidence?: number;
    severity?: string;
    note?: string;
    evidenceCount?: number;
  };
  policyAction?: "allow" | "warn";
  fallbackUsed?: boolean;
};

export type UploadedResearchFile = {
  id: string;
  name: string;
  size?: number;
};

export type ResearchUploadRawResponse = {
  id?: unknown;
  file_id?: unknown;
  uploaded_file_id?: unknown;
  uploaded_file_ids?: unknown;
  file_ids?: unknown;
  file?: unknown;
  files?: unknown;
  uploaded_files?: unknown;
  [key: string]: unknown;
};

export type ResearchUploadResult = {
  uploadedFileIds: string[];
  files: UploadedResearchFile[];
};

export type KnowledgeSource = {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  documents_count: number;
};

export type KnowledgeSourceDocument = {
  id: number;
  source_id: number;
  filename: string;
  content_type: string;
  size: number;
  preview: string;
  token_count: number;
  is_active: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const next = value.trim();
  return next ? next : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function asId(value: unknown): string | undefined {
  const text = asText(value);
  if (text) return text;
  const numeric = asNumber(value);
  return numeric !== undefined ? String(numeric) : undefined;
}

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}

function parseIdList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return uniqueIds(
      value
        .map((item) => {
          if (typeof item === "string" || typeof item === "number") {
            return asId(item);
          }

          const record = asRecord(item);
          if (!record) return undefined;
          return asId(record.id) ?? asId(record.file_id) ?? asId(record.uploaded_file_id);
        })
        .filter((item): item is string => Boolean(item))
    );
  }

  const single = asId(value);
  return single ? [single] : [];
}

function parseCitation(value: unknown): Tier2Citation | null {
  if (typeof value === "string") {
    const title = asText(value);
    return title ? { title } : null;
  }

  const item = asRecord(value);
  if (!item) return null;

  const title =
    asText(item.title) ??
    asText(item.name) ??
    asText(item.source) ??
    asText(item.url) ??
    asText(item.id);

  if (!title) return null;

  return {
    title,
    source: asText(item.source) ?? asText(item.publisher) ?? asText(item.source_id),
    url: asText(item.url),
    snippet: asText(item.snippet) ?? asText(item.summary) ?? asText(item.relevance),
    year: asText(item.year)
  };
}

function parseStep(value: unknown): Tier2Step | null {
  if (typeof value === "string") {
    const title = asText(value);
    return title ? { title } : null;
  }

  const item = asRecord(value);
  if (!item) return null;

  const title =
    asText(item.title) ??
    asText(item.name) ??
    asText(item.label) ??
    asText(item.action) ??
    asText(item.step) ??
    asText(item.stage) ??
    asText(item.objective);

  if (!title) return null;

  return {
    title,
    detail:
      asText(item.detail) ??
      asText(item.description) ??
      asText(item.result) ??
      asText(item.notes) ??
      asText(item.objective) ??
      asText(item.output)
  };
}

function normalizeFlowStatus(value: unknown): ResearchFlowStageStatus {
  const text = (asText(value) ?? "").toLowerCase();

  if (!text) return "pending";
  if (["in_progress", "running", "active", "processing", "started", "streaming"].some((token) => text.includes(token))) {
    return "in_progress";
  }
  if (["completed", "complete", "done", "success", "verified", "pass", "allow"].some((token) => text.includes(token))) {
    return "completed";
  }
  if (["warning", "warn", "degraded"].some((token) => text.includes(token))) {
    return "warning";
  }
  if (["failed", "error", "blocked", "deny", "reject", "timeout"].some((token) => text.includes(token))) {
    return "failed";
  }
  if (["skip", "skipped", "cancelled", "canceled"].some((token) => text.includes(token))) {
    return "skipped";
  }

  return "pending";
}

function toFlowKey(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return normalized.replace(/^_+|_+$/g, "") || "stage";
}

function toFlowLabel(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function parseFlowStage(value: unknown, index: number): ResearchFlowStage | null {
  const item = asRecord(value);
  if (!item) return null;

  const rawStage =
    asText(item.stage) ??
    asText(item.name) ??
    asText(item.step) ??
    asText(item.id) ??
    asText(item.key) ??
    asText(item.title);

  const rawLabel = asText(item.label) ?? asText(item.title) ?? rawStage;
  if (!rawStage && !rawLabel) return null;

  const stageId = toFlowKey(rawStage ?? `stage_${index + 1}`);
  const label = rawLabel ? toFlowLabel(rawLabel) : toFlowLabel(stageId);
  const detail =
    asText(item.detail) ??
    asText(item.description) ??
    asText(item.note) ??
    asText(item.message) ??
    asText(item.objective) ??
    asText(item.output);

  return {
    id: stageId,
    label,
    detail,
    status: normalizeFlowStatus(item.status ?? item.state ?? item.result),
    source: "metadata"
  };
}

function parseFlowEvent(value: unknown, index: number): ResearchFlowEvent | null {
  const item = asRecord(value);
  if (!item) return null;

  const rawStage =
    asText(item.stage) ??
    asText(item.stage_id) ??
    asText(item.step) ??
    asText(item.name) ??
    asText(item.event) ??
    asText(item.id);
  if (!rawStage) return null;

  const label = toFlowLabel(asText(item.label) ?? asText(item.title) ?? rawStage);
  const detail = asText(item.detail) ?? asText(item.message) ?? asText(item.note) ?? asText(item.description);
  const timestamp =
    asText(item.timestamp) ??
    asText(item.ts) ??
    asText(item.time) ??
    asText(item.created_at) ??
    asText(item.at);

  return {
    id: `${toFlowKey(rawStage)}-${index + 1}`,
    stageId: toFlowKey(rawStage),
    label,
    detail,
    status: normalizeFlowStatus(item.status ?? item.state ?? item.event_type ?? item.type),
    timestamp
  };
}

function parseFlowStages(value: unknown): ResearchFlowStage[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => parseFlowStage(item, index))
    .filter((item): item is ResearchFlowStage => Boolean(item));
}

function parseFlowEvents(value: unknown): ResearchFlowEvent[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => parseFlowEvent(item, index))
    .filter((item): item is ResearchFlowEvent => Boolean(item));
}

function deriveStagesFromFlowEvents(events: ResearchFlowEvent[]): ResearchFlowStage[] {
  if (!events.length) return [];

  const stageMap = new Map<string, ResearchFlowStage>();
  const stageOrder: string[] = [];

  events.forEach((event) => {
    const existing = stageMap.get(event.stageId);
    if (!existing) {
      stageOrder.push(event.stageId);
      stageMap.set(event.stageId, {
        id: event.stageId,
        label: event.label,
        detail: event.detail,
        status: event.status,
        source: "flow_events"
      });
      return;
    }

    stageMap.set(event.stageId, {
      ...existing,
      label: event.label || existing.label,
      detail: event.detail ?? existing.detail,
      status: event.status
    });
  });

  return stageOrder
    .map((stageId) => stageMap.get(stageId))
    .filter((item): item is ResearchFlowStage => Boolean(item));
}

function parseRoutingHint(value: unknown): ResearchTier2RoutingHint | undefined {
  const record = asRecord(value);
  if (!record) return undefined;

  const hint: ResearchTier2RoutingHint = {
    role: asText(record.role),
    intent: asText(record.intent),
    confidence: asNumber(record.confidence),
    emergency: typeof record.emergency === "boolean" ? record.emergency : undefined
  };

  if (!hint.role && !hint.intent && hint.confidence === undefined && hint.emergency === undefined) {
    return undefined;
  }

  return hint;
}

function parseUploadedFile(value: unknown): UploadedResearchFile | null {
  if (typeof value === "string" || typeof value === "number") {
    const id = asId(value);
    return id ? { id, name: `File #${id}` } : null;
  }

  const item = asRecord(value);
  if (!item) return null;

  const id = asId(item.id) ?? asId(item.file_id) ?? asId(item.uploaded_file_id);
  if (!id) return null;

  const name = asText(item.file_name) ?? asText(item.filename) ?? asText(item.name) ?? `File #${id}`;
  const size = asNumber(item.file_size) ?? asNumber(item.size);

  return { id, name, size };
}

function parseList<T>(value: unknown, parser: (item: unknown) => T | null): T[] {
  if (!Array.isArray(value)) {
    const single = parser(value);
    return single ? [single] : [];
  }

  return value.map((item) => parser(item)).filter((item): item is T => Boolean(item));
}

export async function uploadResearchFile(file: File): Promise<ResearchUploadResult> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post<ResearchUploadRawResponse>("/research/upload-file", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: RESEARCH_UPLOAD_TIMEOUT_MS
  });

  const data = response.data;
  const files = parseList(data.files ?? data.uploaded_files ?? data.file, parseUploadedFile);
  const idsFromPayload = uniqueIds([
    ...parseIdList(data.uploaded_file_ids),
    ...parseIdList(data.file_ids),
    ...parseIdList(data.uploaded_file_id),
    ...parseIdList(data.file_id),
    ...parseIdList(data.id)
  ]);
  const idsFromFiles = files.map((item) => item.id);
  const uploadedFileIds = uniqueIds([...idsFromPayload, ...idsFromFiles]);

  if (!files.length && uploadedFileIds.length) {
    return {
      uploadedFileIds,
      files: uploadedFileIds.map((id, index) => ({
        id,
        name: index === 0 ? file.name : `${file.name} (${index + 1})`,
        size: file.size
      }))
    };
  }

  return { uploadedFileIds, files };
}

export async function runResearchTier2(
  query: string,
  options?: { uploadedFileIds?: string[]; sourceIds?: number[] }
): Promise<ResearchTier2RawResponse> {
  const uploadedFileIds = uniqueIds((options?.uploadedFileIds ?? []).map((item) => item.trim()).filter(Boolean));
  const sourceIds = Array.from(
    new Set((options?.sourceIds ?? []).filter((item) => Number.isFinite(item) && item > 0).map((item) => Math.trunc(item)))
  );
  const payload: Record<string, unknown> = { query, message: query };

  if (uploadedFileIds.length) {
    payload.uploaded_file_ids = uploadedFileIds;
  }
  if (sourceIds.length) {
    payload.source_ids = sourceIds;
  }

  const response = await api.post<ResearchTier2RawResponse>("/research/tier2", payload, {
    timeout: RESEARCH_TIER2_TIMEOUT_MS
  });
  return response.data;
}

export function normalizeResearchTier2(data: ResearchTier2RawResponse): ResearchTier2Result {
  const answer = asText(data.answer) ?? asText(data.summary) ?? asText(data.message) ?? "";
  const citations = parseList(data.citations ?? data.sources, parseCitation);
  const metadata = asRecord(data.metadata) ?? {};
  const flowEvents = parseFlowEvents(data.flow_events ?? metadata.flow_events ?? data.events);
  const metadataStages = parseFlowStages(metadata.stages ?? data.stages);
  const flowStages = metadataStages.length ? metadataStages : deriveStagesFromFlowEvents(flowEvents);
  const parsedSteps = parseList(data.steps ?? data.workflow_steps ?? data.plan_steps, parseStep);
  const steps = parsedSteps.length
    ? parsedSteps
    : flowStages.map((stage) => ({
        title: stage.label,
        detail: stage.detail
      }));
  const verification = asRecord(metadata.verification_status);
  const rawPolicy = (asText(metadata.policy_action) ?? asText(data.policy_action))?.toLowerCase();
  const policyAction = rawPolicy === "warn" ? "warn" : rawPolicy === "allow" ? "allow" : undefined;
  const fallbackUsed =
    typeof metadata.fallback_used === "boolean"
      ? metadata.fallback_used
      : typeof data.fallback_used === "boolean"
        ? data.fallback_used
        : undefined;
  const rawVerificationState = asText(metadata.verification_status);

  const verificationStatus = verification
    ? {
        verdict: asText(verification.verdict) ?? asText(verification.state),
        confidence: asNumber(verification.confidence),
        severity: asText(verification.severity),
        note: asText(verification.note),
        evidenceCount: asNumber(verification.evidence_count)
      }
    : rawVerificationState
      ? {
          verdict: rawVerificationState
        }
      : undefined;

  return {
    answer,
    citations,
    steps,
    flowStages,
    flowEvents,
    debug: {
      pipeline: asText(metadata.pipeline),
      responseStyle: asText(metadata.response_style),
      sourceMode: asText(metadata.source_mode),
      stageCount: flowStages.length,
      flowEventCount: flowEvents.length,
      routing: parseRoutingHint(metadata.routing)
    },
    verificationStatus,
    policyAction,
    fallbackUsed
  };
}

function parseKnowledgeSource(item: unknown): KnowledgeSource | null {
  const value = asRecord(item);
  if (!value) return null;
  const id = asNumber(value.id);
  const name = asText(value.name);
  if (!id || !name) return null;
  return {
    id: Math.trunc(id),
    name,
    description: asText(value.description) ?? "",
    is_active: Boolean(value.is_active ?? true),
    documents_count: Math.trunc(asNumber(value.documents_count) ?? 0),
  };
}

function parseKnowledgeSourceDocument(item: unknown): KnowledgeSourceDocument | null {
  const value = asRecord(item);
  if (!value) return null;
  const id = asNumber(value.id);
  const sourceId = asNumber(value.source_id);
  const filename = asText(value.filename);
  if (!id || !sourceId || !filename) return null;
  return {
    id: Math.trunc(id),
    source_id: Math.trunc(sourceId),
    filename,
    content_type: asText(value.content_type) ?? "application/octet-stream",
    size: Math.trunc(asNumber(value.size) ?? 0),
    preview: asText(value.preview) ?? "",
    token_count: Math.trunc(asNumber(value.token_count) ?? 0),
    is_active: Boolean(value.is_active ?? true),
  };
}

export async function listKnowledgeSources(): Promise<KnowledgeSource[]> {
  const response = await api.get<{ items?: unknown }>("/research/knowledge-sources");
  const items = asRecord(response.data)?.items;
  return parseList(items, parseKnowledgeSource);
}

export async function createKnowledgeSource(name: string, description = ""): Promise<KnowledgeSource> {
  const response = await api.post<unknown>("/research/knowledge-sources", { name, description });
  const parsed = parseKnowledgeSource(response.data);
  if (!parsed) throw new Error("Không thể tạo knowledge source.");
  return parsed;
}

export async function updateKnowledgeSource(
  sourceId: number,
  payload: { is_active?: boolean; name?: string; description?: string }
): Promise<KnowledgeSource> {
  const response = await api.patch<unknown>(`/research/knowledge-sources/${sourceId}`, payload);
  const parsed = parseKnowledgeSource(response.data);
  if (!parsed) throw new Error("Không thể cập nhật knowledge source.");
  return parsed;
}

export async function listKnowledgeSourceDocuments(sourceId: number): Promise<KnowledgeSourceDocument[]> {
  const response = await api.get<{ items?: unknown }>(`/research/knowledge-sources/${sourceId}/documents`);
  const items = asRecord(response.data)?.items;
  return parseList(items, parseKnowledgeSourceDocument);
}

export async function uploadFileToKnowledgeSource(sourceId: number, file: File): Promise<KnowledgeSourceDocument> {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post<unknown>(`/research/knowledge-sources/${sourceId}/upload-file`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: RESEARCH_UPLOAD_TIMEOUT_MS
  });
  const record = asRecord(response.data)?.document;
  const parsed = parseKnowledgeSourceDocument(record);
  if (!parsed) throw new Error("Không thể upload file vào knowledge source.");
  return parsed;
}

export async function setKnowledgeDocumentStatus(documentId: number, isActive: boolean): Promise<KnowledgeSourceDocument> {
  const response = await api.patch<unknown>(`/research/documents/${documentId}`, { is_active: isActive });
  const parsed = parseKnowledgeSourceDocument(response.data);
  if (!parsed) throw new Error("Không thể cập nhật trạng thái document.");
  return parsed;
}
