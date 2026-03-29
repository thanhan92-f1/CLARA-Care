"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/admin/admin-shell";
import {
  KnowledgeSource,
  KnowledgeSourceDocument,
  createKnowledgeSource,
  listKnowledgeSourceDocuments,
  listKnowledgeSources,
  setKnowledgeDocumentStatus,
  uploadFileToKnowledgeSource,
} from "@/lib/research";

function formatSize(size: number): string {
  if (!Number.isFinite(size) || size <= 0) return "0 B";
  if (size < 1024) return `${size} B`;
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export default function AdminKnowledgeSourcesPage() {
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [activeSourceId, setActiveSourceId] = useState<number | null>(null);
  const [documents, setDocuments] = useState<KnowledgeSourceDocument[]>([]);
  const [newSourceName, setNewSourceName] = useState("");
  const [isLoadingSources, setIsLoadingSources] = useState(true);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [isCreatingSource, setIsCreatingSource] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const activeSource = useMemo(
    () => sources.find((source) => source.id === activeSourceId) ?? null,
    [sources, activeSourceId]
  );

  const loadSources = async () => {
    setIsLoadingSources(true);
    setError("");
    try {
      const items = await listKnowledgeSources();
      setSources(items);
      if (items.length && !activeSourceId) {
        setActiveSourceId(items[0].id);
      }
      if (!items.length) {
        setActiveSourceId(null);
        setDocuments([]);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải knowledge sources.");
    } finally {
      setIsLoadingSources(false);
    }
  };

  const loadDocuments = async (sourceId: number) => {
    setIsLoadingDocs(true);
    setError("");
    try {
      const items = await listKnowledgeSourceDocuments(sourceId);
      setDocuments(items);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tải tài liệu của source.");
    } finally {
      setIsLoadingDocs(false);
    }
  };

  useEffect(() => {
    void loadSources();
  }, []);

  useEffect(() => {
    if (!activeSourceId) return;
    void loadDocuments(activeSourceId);
  }, [activeSourceId]);

  const onCreateSource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = newSourceName.trim();
    if (!name || isCreatingSource) return;

    setIsCreatingSource(true);
    setError("");
    setMessage("");
    try {
      const source = await createKnowledgeSource(name);
      setSources((prev) => [source, ...prev]);
      setActiveSourceId(source.id);
      setNewSourceName("");
      setMessage("Đã tạo knowledge source mới.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tạo source.");
    } finally {
      setIsCreatingSource(false);
    }
  };

  const onUploadFile = async (file: File) => {
    if (!activeSourceId) return;
    setIsUploading(true);
    setError("");
    setMessage("");
    try {
      await uploadFileToKnowledgeSource(activeSourceId, file);
      await loadDocuments(activeSourceId);
      await loadSources();
      setMessage("Upload tài liệu thành công.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể upload file vào source.");
    } finally {
      setIsUploading(false);
    }
  };

  const onToggleDocument = async (document: KnowledgeSourceDocument) => {
    setError("");
    try {
      const updated = await setKnowledgeDocumentStatus(document.id, !document.is_active);
      setDocuments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể cập nhật trạng thái document.");
    }
  };

  return (
    <AdminShell
      activeTab="knowledge-sources"
      title="Knowledge Sources"
      description="Quản lý kho tri thức riêng cho RAG theo từng source (Dify-lite): tạo source, upload file, bật/tắt document."
    >
      <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/85">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Nguồn tri thức</h3>
          <form onSubmit={onCreateSource} className="mt-3 flex gap-2">
            <input
              value={newSourceName}
              onChange={(event) => setNewSourceName(event.target.value)}
              placeholder="Tên source mới"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={isCreatingSource || !newSourceName.trim()}
              className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 dark:bg-slate-100 dark:text-slate-900"
            >
              +
            </button>
          </form>

          <div className="mt-3 space-y-2">
            {isLoadingSources ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p>
            ) : sources.length ? (
              sources.map((source) => {
                const active = source.id === activeSourceId;
                return (
                  <button
                    key={source.id}
                    type="button"
                    onClick={() => setActiveSourceId(source.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left transition ${
                      active
                        ? "border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-600 dark:bg-sky-950/45 dark:text-sky-200"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600"
                    }`}
                  >
                    <p className="text-sm font-semibold">{source.name}</p>
                    <p className="mt-1 text-xs">{source.documents_count} tài liệu</p>
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">Chưa có source nào.</p>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/85">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Documents trong source</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{activeSource ? activeSource.name : "Chưa chọn source"}</p>
            </div>
            <label className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
              {isUploading ? "Đang upload..." : "Upload file"}
              <input
                type="file"
                className="hidden"
                disabled={!activeSource || isUploading}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.currentTarget.value = "";
                  if (file) {
                    void onUploadFile(file);
                  }
                }}
              />
            </label>
          </div>

          {error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/60 dark:text-red-300">{error}</p> : null}
          {message ? <p className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">{message}</p> : null}

          <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <th className="px-3 py-2">File</th>
                  <th className="px-3 py-2">Size</th>
                  <th className="px-3 py-2">Tokens</th>
                  <th className="px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingDocs ? (
                  <tr>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400" colSpan={4}>Đang tải tài liệu...</td>
                  </tr>
                ) : documents.length ? (
                  documents.map((document) => (
                    <tr key={document.id} className="border-b border-slate-100 bg-white last:border-0 dark:border-slate-800 dark:bg-slate-900/70">
                      <td className="px-3 py-2">
                        <p className="font-medium text-slate-800 dark:text-slate-100">{document.filename}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">ID: {document.id}</p>
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{formatSize(document.size)}</td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200">{document.token_count}</td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() => onToggleDocument(document)}
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${
                            document.is_active
                              ? "border border-emerald-300 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/55 dark:text-emerald-300"
                              : "border border-slate-300 bg-slate-100 text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {document.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-3 py-3 text-slate-500 dark:text-slate-400" colSpan={4}>Chưa có document trong source này.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
