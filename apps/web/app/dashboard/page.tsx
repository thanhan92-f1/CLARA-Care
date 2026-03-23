"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import PageShell from "@/components/ui/page-shell";
import { UserRole, getRole } from "@/lib/auth-store";
import { getApiHealth, normalizeApiHealth } from "@/lib/system";

const ROLE_LABELS: Record<UserRole, string> = {
  normal: "Normal",
  researcher: "Researcher",
  doctor: "Doctor"
};

const MODULE_LINKS = [
  { href: "/careguard", label: "CareGuard", description: "Triaging nhanh theo triệu chứng, thuốc, dị ứng." },
  { href: "/scribe", label: "Medical Scribe", description: "Tạo SOAP note từ transcript buổi khám." },
  { href: "/research", label: "Research Workspace", description: "Tier1/Tier2 nghiên cứu có citations và steps." },
  { href: "/council", label: "AI Council", description: "Điểm truy cập workflow hội chẩn." }
];

export default function DashboardPage() {
  const [role, setRole] = useState<UserRole>("normal");
  const [healthStatus, setHealthStatus] = useState("Not checked");
  const [healthMessage, setHealthMessage] = useState("Click để kiểm tra nhanh API health.");
  const [healthError, setHealthError] = useState("");
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  useEffect(() => {
    setRole(getRole());
  }, []);

  const roleLabel = useMemo(() => ROLE_LABELS[role] ?? "Normal", [role]);

  const onCheckHealth = async () => {
    setHealthError("");
    setIsCheckingHealth(true);

    try {
      const response = await getApiHealth();
      const normalized = normalizeApiHealth(response);
      setHealthStatus(normalized.status);
      setHealthMessage(normalized.message);
      setCheckedAt(new Date().toLocaleString("vi-VN"));
    } catch (error) {
      const fallbackMessage = "Không thể kiểm tra health endpoint.";
      if (error instanceof Error && error.message) {
        setHealthError(error.message);
      } else {
        setHealthError(fallbackMessage);
      }
    } finally {
      setIsCheckingHealth(false);
    }
  };

  return (
    <PageShell title="Dashboard">
      <div className="grid gap-4 md:grid-cols-2">
        <section className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Auth Role</p>
          <p className="text-xl font-semibold text-slate-900">{roleLabel}</p>
          <p className="text-sm text-slate-600">Role hiện tại quyết định menu và khả năng truy cập module.</p>
          <Link href="/role-select" className="inline-block text-sm font-medium text-blue-600 hover:underline">
            Đổi vai trò
          </Link>
        </section>

        <section className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">API Health Quick Check</p>
          <p className="text-lg font-semibold text-slate-900">{healthStatus}</p>
          <p className="text-sm text-slate-600">{healthMessage}</p>
          {checkedAt ? <p className="text-xs text-slate-500">Last check: {checkedAt}</p> : null}
          {healthError ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{healthError}</p>
          ) : null}
          <button
            type="button"
            className="rounded bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
            onClick={onCheckHealth}
            disabled={isCheckingHealth}
          >
            {isCheckingHealth ? "Đang kiểm tra..." : "Run Quick Check"}
          </button>
        </section>

        <section className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Modules</p>
          <div className="grid gap-2 md:grid-cols-2">
            {MODULE_LINKS.map((module) => (
              <Link
                key={module.href}
                href={module.href}
                className="rounded-md border border-slate-200 bg-white p-3 transition hover:border-blue-300 hover:bg-blue-50"
              >
                <p className="text-sm font-semibold text-slate-900">{module.label}</p>
                <p className="mt-1 text-sm text-slate-600">{module.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
