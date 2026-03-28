import { ReactNode } from "react";

function toneClass(tone: "success" | "error" | "info"): string {
  if (tone === "success") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (tone === "error") return "border-red-200 bg-red-50 text-red-800";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export function AuthMessage({ tone, children }: { tone: "success" | "error" | "info"; children: ReactNode }) {
  return <p className={`rounded-xl border px-3 py-2 text-sm ${toneClass(tone)}`}>{children}</p>;
}

export default function AuthFeedback({
  notice,
  error,
  noticeNode,
  errorNode
}: {
  notice?: string;
  error?: string;
  noticeNode?: ReactNode;
  errorNode?: ReactNode;
}) {
  if (!notice && !error) return null;

  return (
    <div className="space-y-2">
      {notice ? <AuthMessage tone="success">{noticeNode ?? notice}</AuthMessage> : null}
      {error ? <AuthMessage tone="error">{errorNode ?? error}</AuthMessage> : null}
    </div>
  );
}
