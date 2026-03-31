"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import PageShell from "@/components/ui/page-shell";
import { UserRole, getRole } from "@/lib/auth-store";
import api from "@/lib/http-client";
import { listResearchConversations } from "@/lib/research";
import { getCabinet } from "@/lib/selfmed";
import {
  getApiHealth,
  getSystemDependencies,
  getSystemMetrics,
  normalizeApiHealth,
  normalizeSystemDependencies,
  normalizeSystemMetrics
} from "@/lib/system";

type AuthMePayload = {
  subject?: string;
  role?: UserRole;
  full_name?: string;
};

type QuickAction = {
  href: string;
  tag: string;
  label: string;
  detail: string;
};

type TodayTask = {
  id: string;
  title: string;
  detail: string;
  tone: "normal" | "warn" | "critical";
  href: string;
};

type StatusTone = "ok" | "warn" | "error" | "neutral";

const ROLE_LABELS: Record<UserRole, string> = {
  normal: "Người dùng cá nhân",
  researcher: "Nhà nghiên cứu",
  doctor: "Bác sĩ",
  admin: "Quản trị hệ thống"
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    href: "/selfmed/add",
    tag: "SelfMed",
    label: "Thêm thuốc mới",
    detail: "Nhập tay hoặc OCR để cập nhật tủ thuốc."
  },
  {
    href: "/careguard",
    tag: "CareGuard",
    label: "Check tương tác DDI",
    detail: "Kiểm tra rủi ro tương tác theo tủ thuốc hiện tại."
  },
  {
    href: "/research",
    tag: "Research",
    label: "Nghiên cứu chuyên sâu",
    detail: "Hỏi đáp có citation và flow verification."
  },
  {
    href: "/selfmed",
    tag: "Cabinet",
    label: "Rà soát tủ thuốc",
    detail: "Xem thuốc sắp hết hạn hoặc dữ liệu thiếu liều dùng."
  }
];

function formatCount(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value);
}

function formatDateTime(value: number): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString("vi-VN", {
    hour12: false,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getGreeting(now: Date): { title: string; subtitle: string } {
  const hour = now.getHours();
  if (hour < 12) {
    return {
      title: "Good morning",
      subtitle: "Bắt đầu ngày mới: rà soát thuốc và ưu tiên an toàn trước khi dùng."
    };
  }
  if (hour < 18) {
    return {
      title: "Good afternoon",
      subtitle: "Giữ điều trị ổn định: kiểm tra tương tác và cập nhật tủ thuốc hôm nay."
    };
  }
  return {
    title: "Good evening",
    subtitle: "Tổng kết cuối ngày: xác nhận thuốc đã dùng và kế hoạch ngày mai."
  };
}

function toneFromStatus(status: string): StatusTone {
  const normalized = status.toLowerCase();
  if (["ok", "healthy", "up", "pass", "ready"].some((token) => normalized.includes(token))) return "ok";
  if (["warn", "warning", "degraded", "slow", "unstable"].some((token) => normalized.includes(token))) return "warn";
  if (["down", "fail", "error", "critical", "unhealthy"].some((token) => normalized.includes(token))) return "error";
  return "neutral";
}

function badgeClassForTone(tone: StatusTone): string {
  if (tone === "ok") {
    return "border-[color:var(--status-ok-border)] bg-[color:var(--status-ok-bg)] text-[color:var(--status-ok-text)]";
  }
  if (tone === "warn") {
    return "border-[color:var(--status-warn-border)] bg-[color:var(--status-warn-bg)] text-[color:var(--status-warn-text)]";
  }
  if (tone === "error") {
    return "border-[color:var(--status-danger-border)] bg-[color:var(--status-danger-bg)] text-[color:var(--status-danger-text)]";
  }
  return "border-[color:var(--status-neutral-border)] bg-[color:var(--status-neutral-bg)] text-[color:var(--status-neutral-text)]";
}

function panelClassForTone(tone: StatusTone): string {
  if (tone === "ok") {
    return "border-[color:var(--status-ok-border)] bg-[color:var(--status-ok-bg)]";
  }
  if (tone === "warn") {
    return "border-[color:var(--status-warn-border)] bg-[color:var(--status-warn-bg)]";
  }
  if (tone === "error") {
    return "border-[color:var(--status-danger-border)] bg-[color:var(--status-danger-bg)]";
  }
  return "border-[color:var(--status-neutral-border)] bg-[color:var(--status-neutral-bg)]";
}

function timelineClassForTaskTone(tone: TodayTask["tone"]): string {
  if (tone === "critical") {
    return "border-[color:var(--status-danger-border)]";
  }
  if (tone === "warn") {
    return "border-[color:var(--status-warn-border)]";
  }
  return "border-[color:var(--shell-border)]";
}

function timelineDotClassForTaskTone(tone: TodayTask["tone"]): string {
  if (tone === "critical") {
    return "bg-[color:var(--status-danger-text)]";
  }
  if (tone === "warn") {
    return "bg-[color:var(--status-warn-text)]";
  }
  return "bg-[color:var(--text-brand)]";
}

export default function DashboardPage() {
  const [role, setRole] = useState<UserRole>("normal");
  const [displayName, setDisplayName] = useState("bạn");
  const [userSubject, setUserSubject] = useState("");

  const [healthStatus, setHealthStatus] = useState("unknown");
  const [healthMessage, setHealthMessage] = useState("Chưa có dữ liệu health.");
  const [mlStatus, setMlStatus] = useState("unknown");
  const [mlReachable, setMlReachable] = useState<boolean | null>(null);

  const [requestCount, setRequestCount] = useState<number | null>(null);
  const [errorCount, setErrorCount] = useState<number | null>(null);
  const [avgLatencyMs, setAvgLatencyMs] = useState<number | null>(null);

  const [cabinetCount, setCabinetCount] = useState<number | null>(null);
  const [expiringSoonCount, setExpiringSoonCount] = useState<number | null>(null);
  const [expiredCount, setExpiredCount] = useState<number | null>(null);
  const [missingDosageCount, setMissingDosageCount] = useState<number | null>(null);

  const [recentQueries, setRecentQueries] = useState<Array<{ id: string; query: string; createdAt: number }>>([]);
  const [alerts, setAlerts] = useState<string[]>([]);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const roleLabel = useMemo(() => ROLE_LABELS[role] ?? ROLE_LABELS.normal, [role]);
  const greeting = useMemo(() => getGreeting(new Date()), []);

  const ddiRiskLabel = useMemo(() => {
    const total = cabinetCount ?? 0;
    if (total < 2) return "Thấp";
    if (total < 5) return "Trung bình";
    return "Cao";
  }, [cabinetCount]);

  const pendingActions = useMemo(() => {
    let count = 0;
    if ((cabinetCount ?? 0) >= 2) count += 1;
    if ((expiringSoonCount ?? 0) > 0) count += expiringSoonCount ?? 0;
    if ((expiredCount ?? 0) > 0) count += expiredCount ?? 0;
    if ((missingDosageCount ?? 0) > 0) count += missingDosageCount ?? 0;
    return count;
  }, [cabinetCount, expiringSoonCount, expiredCount, missingDosageCount]);

  const todayTasks = useMemo<TodayTask[]>(() => {
    const tasks: TodayTask[] = [];
    if ((expiredCount ?? 0) > 0) {
      tasks.push({
        id: "expired",
        title: `Loại bỏ ${expiredCount} thuốc đã hết hạn`,
        detail: "Dọn ngay để tránh nhầm thuốc trong lần dùng tiếp theo.",
        tone: "critical",
        href: "/selfmed"
      });
    }
    if ((expiringSoonCount ?? 0) > 0) {
      tasks.push({
        id: "expiring",
        title: `Rà soát ${expiringSoonCount} thuốc sắp hết hạn`,
        detail: "Chuẩn bị thay thế để không gián đoạn điều trị.",
        tone: "warn",
        href: "/selfmed"
      });
    }
    if ((cabinetCount ?? 0) >= 2) {
      tasks.push({
        id: "ddi",
        title: "Chạy kiểm tra tương tác DDI hôm nay",
        detail: "Kiểm tra nhanh các cặp nguy cơ cao trước khi dùng thuốc.",
        tone: "normal",
        href: "/careguard"
      });
    }
    if ((missingDosageCount ?? 0) > 0) {
      tasks.push({
        id: "dosage",
        title: `Bổ sung liều dùng cho ${missingDosageCount} thuốc`,
        detail: "Dữ liệu đầy đủ giúp pipeline DDI và advisor chính xác hơn.",
        tone: "warn",
        href: "/selfmed"
      });
    }
    if (tasks.length === 0) {
      tasks.push({
        id: "calm",
        title: "Hôm nay hệ thống ổn định",
        detail: "Bạn có thể tiếp tục cập nhật dữ liệu mới hoặc chạy research chuyên sâu.",
        tone: "normal",
        href: "/research"
      });
    }
    return tasks.slice(0, 4);
  }, [cabinetCount, expiredCount, expiringSoonCount, missingDosageCount]);

  const refreshDashboard = useCallback(async () => {
    setIsRefreshing(true);
    const nextAlerts: string[] = [];

    try {
      const [healthResult, metricsResult, dependenciesResult, cabinetResult, meResult, conversationsResult] = await Promise.allSettled([
        getApiHealth(),
        getSystemMetrics(),
        getSystemDependencies(),
        getCabinet(),
        api.get<AuthMePayload>("/auth/me"),
        listResearchConversations(5)
      ]);

      if (healthResult.status === "fulfilled") {
        const health = normalizeApiHealth(healthResult.value);
        setHealthStatus(health.status);
        setHealthMessage(health.message);
      } else {
        nextAlerts.push("Không thể lấy trạng thái sức khỏe API.");
      }

      if (metricsResult.status === "fulfilled") {
        const metrics = normalizeSystemMetrics(metricsResult.value);
        setRequestCount(metrics.requestCount);
        setErrorCount(metrics.errorCount);
        setAvgLatencyMs(metrics.avgLatencyMs);
      } else {
        nextAlerts.push("Không thể lấy số liệu hệ thống.");
      }

      if (dependenciesResult.status === "fulfilled") {
        const dependencies = normalizeSystemDependencies(dependenciesResult.value);
        setMlStatus(dependencies.mlStatus);
        setMlReachable(dependencies.mlReachable);
      } else {
        nextAlerts.push("Không thể lấy trạng thái phụ thuộc hệ thống.");
      }

      if (cabinetResult.status === "fulfilled") {
        const items = cabinetResult.value.items ?? [];
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        const soonBoundary = now + 30 * dayMs;

        let soon = 0;
        let expired = 0;
        let missingDosage = 0;

        items.forEach((item) => {
          if (!String(item.dosage ?? "").trim()) {
            missingDosage += 1;
          }
          if (!item.expires_on) return;
          const expireMs = Date.parse(item.expires_on);
          if (!Number.isFinite(expireMs)) return;
          if (expireMs < now) {
            expired += 1;
          } else if (expireMs <= soonBoundary) {
            soon += 1;
          }
        });

        setCabinetCount(items.length);
        setExpiringSoonCount(soon);
        setExpiredCount(expired);
        setMissingDosageCount(missingDosage);
      } else {
        nextAlerts.push("Không thể tải dữ liệu tủ thuốc.");
      }

      if (meResult.status === "fulfilled") {
        const me = meResult.value.data ?? {};
        if (me.role) {
          setRole(me.role);
        }
        const subject = String(me.subject ?? "");
        const fullName = String(me.full_name ?? "").trim();
        const inferredName = subject.includes("@") ? subject.split("@")[0] : "bạn";
        setDisplayName(fullName || inferredName || "bạn");
        setUserSubject(subject);
      }

      if (conversationsResult.status === "fulfilled") {
        const mapped = conversationsResult.value
          .map((item) => ({
            id: String(item.id),
            query: String(item.query ?? "").trim(),
            createdAt: Number(item.createdAt ?? Date.now())
          }))
          .filter((item) => item.query);
        setRecentQueries(mapped);
      } else {
        nextAlerts.push("Không thể tải lịch sử research gần đây.");
      }

      setAlerts(nextAlerts);
      setCheckedAt(new Date().toLocaleString("vi-VN"));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setRole(getRole());
    void refreshDashboard();
  }, [refreshDashboard]);

  const healthTone = toneFromStatus(healthStatus);
  const mlTone = toneFromStatus(
    mlReachable === true ? "ok" : mlReachable === false ? "error" : mlStatus
  );

  const medicationCards = [
    {
      label: "Số lượng thuốc",
      value: formatCount(cabinetCount),
      hint: "Đang quản lý trong tủ thuốc"
    },
    {
      label: "Sắp hết hạn (30 ngày)",
      value: formatCount(expiringSoonCount),
      hint: "Nên ưu tiên thay thế"
    },
    {
      label: "Đã hết hạn",
      value: formatCount(expiredCount),
      hint: "Cần loại bỏ để tránh nhầm"
    },
    {
      label: "Thiếu liều dùng",
      value: formatCount(missingDosageCount),
      hint: "Nên bổ sung để check DDI chính xác"
    }
  ];

  return (
    <PageShell
      title="Dashboard"
      description="Trung tâm điều phối hàng ngày cho CLARA: tủ thuốc, cảnh báo tương tác và tác vụ ưu tiên."
      variant="plain"
    >
      <div className="dashboard-atmosphere space-y-5 lg:space-y-6">
        <section className="dashboard-fade-up dashboard-holo-panel relative overflow-hidden rounded-[2rem] p-5 sm:p-6 lg:p-7">
          <div className="pointer-events-none absolute -right-24 top-0 h-56 w-56 rounded-full bg-sky-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-52 w-52 rounded-full bg-emerald-300/16 blur-3xl" />

          <div className="relative grid gap-6 xl:grid-cols-[1.35fr_1fr]">
            <div className="space-y-5">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                    Daily Command Center
                  </p>
                  <span className="dashboard-live-pill inline-flex min-h-7 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold">
                    realtime sync
                  </span>
                </div>
                <h2 className="text-3xl font-semibold text-[var(--text-primary)] sm:text-[2.3rem]">
                  {greeting.title}, {displayName}
                </h2>
                <p className="max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                  {greeting.subtitle}
                </p>
              </div>

              <div className="dashboard-fade-up flex flex-wrap gap-2.5 text-xs" data-delay="1">
                <span className="inline-flex min-h-9 items-center rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-1 font-medium text-[var(--text-secondary)]">
                  Vai trò: {roleLabel}
                </span>
                <span className="inline-flex min-h-9 items-center rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-1 font-medium text-[var(--text-secondary)]">
                  DDI risk: {ddiRiskLabel}
                </span>
                {userSubject ? (
                  <span className="inline-flex min-h-9 items-center rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-1 font-medium text-[var(--text-secondary)]">
                    {userSubject}
                  </span>
                ) : null}
                <span className="inline-flex min-h-9 items-center rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-1 font-medium text-[var(--text-secondary)]">
                  {checkedAt ? `Cập nhật: ${checkedAt}` : "Đang đồng bộ dữ liệu..."}
                </span>
              </div>

              <div className="dashboard-fade-up flex flex-wrap gap-2.5" data-delay="2">
                <button
                  type="button"
                  onClick={refreshDashboard}
                  disabled={isRefreshing}
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-sky-700 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isRefreshing ? "Đang làm mới..." : "Làm mới trạng thái"}
                </button>
                <Link
                  href="/role-select"
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:-translate-y-0.5 hover:border-[color:var(--shell-border-strong)] hover:bg-[var(--surface-brand-soft)] focus-visible:outline-none"
                >
                  Đổi vai trò
                </Link>
              </div>
            </div>

            <aside className="dashboard-fade-up border-t border-[color:var(--shell-border)] pt-5 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0" data-delay="3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                Bạn muốn làm gì hôm nay?
              </p>
              <div className="mt-3 space-y-2">
                {QUICK_ACTIONS.map((action) => (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="group flex min-h-11 items-start gap-3 rounded-xl border-l-2 border-transparent px-2 py-2 transition hover:border-[color:var(--shell-border-strong)] hover:bg-[color:var(--dashboard-accent-soft)] focus-visible:outline-none"
                  >
                    <span className="mt-0.5 rounded-md border border-[color:var(--shell-border)] bg-[var(--surface-panel)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-secondary)]">
                      {action.tag}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[var(--text-primary)]">{action.label}</span>
                      <span className="mt-0.5 block text-xs text-[var(--text-secondary)]">{action.detail}</span>
                    </span>
                    <span className="mt-0.5 text-sm text-[var(--text-muted)] transition group-hover:translate-x-0.5">→</span>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="dashboard-fade-up dashboard-strip-panel rounded-[1.5rem] px-4 py-4 sm:px-5" data-delay="1">
          <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
            {medicationCards.map((item, index) => (
              <article
                key={item.label}
                className={`space-y-1.5 px-1 sm:px-3 ${index > 0 ? "sm:border-l sm:border-[color:var(--shell-border)]" : ""}`}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[var(--text-muted)]">{item.label}</p>
                <p className="font-mono text-[1.7rem] font-semibold text-[var(--text-primary)]">{item.value}</p>
                <p className="text-xs text-[var(--text-muted)]">{item.hint}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.5fr_0.62fr]">
          <div className="dashboard-fade-up dashboard-holo-panel rounded-[1.65rem] p-4 sm:p-5" data-delay="2">
            <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
              <section>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                  Recent Research Activity
                </p>
                <div className="mt-3 space-y-2.5">
                  {recentQueries.length > 0 ? (
                    recentQueries.map((query) => (
                      <article
                        key={query.id}
                        className="rounded-xl border border-[color:var(--shell-border)] bg-[color:var(--dashboard-accent-soft)] px-3 py-2.5"
                      >
                        <p className="line-clamp-2 text-sm text-[var(--text-primary)]">{query.query}</p>
                        <p className="mt-1 text-xs text-[var(--text-muted)]">{formatDateTime(query.createdAt)}</p>
                      </article>
                    ))
                  ) : (
                    <p className="rounded-xl border border-[color:var(--shell-border)] bg-[color:var(--dashboard-accent-soft)] px-3 py-2.5 text-sm text-[var(--text-secondary)]">
                      Chưa có lịch sử research gần đây.
                    </p>
                  )}
                </div>
              </section>

              <section className="border-t border-[color:var(--shell-border)] pt-4 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                      Hôm nay cần xử lý
                    </p>
                    <h3 className="mt-1 text-base font-semibold text-[var(--text-primary)]">Today Plan</h3>
                  </div>
                  <span className="inline-flex min-h-8 items-center rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                    {todayTasks.length} mục
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  {todayTasks.map((task) => (
                    <Link
                      key={task.id}
                      href={task.href}
                      className={`group relative block rounded-xl border bg-[color:var(--dashboard-accent-soft)] px-3 py-2.5 pl-5 transition hover:-translate-y-0.5 hover:border-[color:var(--shell-border-strong)] focus-visible:outline-none ${timelineClassForTaskTone(task.tone)}`}
                    >
                      <span className={`absolute left-2.5 top-3.5 h-2 w-2 rounded-full ${timelineDotClassForTaskTone(task.tone)}`} />
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{task.title}</p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">{task.detail}</p>
                    </Link>
                  ))}
                </div>
              </section>
            </div>
          </div>

          <aside className="space-y-3.5">
            <section className={`dashboard-fade-up dashboard-side-panel rounded-[1.3rem] border p-4 ${panelClassForTone(healthTone)}`} data-delay="2">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">API Health</p>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClassForTone(healthTone)}`}>
                  {healthStatus}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{healthMessage}</p>
            </section>

            <section className={`dashboard-fade-up dashboard-side-panel rounded-[1.3rem] border p-4 ${panelClassForTone(mlTone)}`} data-delay="3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">ML Runtime</p>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClassForTone(mlTone)}`}>
                  {mlReachable === true ? "reachable" : mlReachable === false ? "offline" : mlStatus}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {mlReachable === true ? "Sẵn sàng cho DDI/Research pipeline." : "Kiểm tra service ML hoặc bật fallback mode."}
              </p>
            </section>

            <section className="dashboard-fade-up dashboard-side-panel rounded-[1.3rem] border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-4" data-delay="4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">System Metrics</p>
              <div className="mt-2.5 space-y-1.5 text-sm text-[var(--text-secondary)]">
                <p>
                  Request tổng: <span className="font-semibold text-[var(--text-primary)]">{formatCount(requestCount)}</span>
                </p>
                <p>
                  Error tổng: <span className="font-semibold text-[var(--text-primary)]">{formatCount(errorCount)}</span>
                </p>
                <p>
                  Latency TB:{" "}
                  <span className="font-semibold text-[var(--text-primary)]">
                    {avgLatencyMs === null ? "--" : `${avgLatencyMs.toFixed(2)} ms`}
                  </span>
                </p>
                <p>
                  Pending actions: <span className="font-semibold text-[var(--text-primary)]">{formatCount(pendingActions)}</span>
                </p>
              </div>
            </section>
          </aside>
        </section>

        {alerts.length > 0 ? (
          <section className="dashboard-fade-up dashboard-side-panel rounded-[1.5rem] border border-[color:var(--status-danger-border)] bg-[color:var(--status-danger-bg)] p-4" data-delay="4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--status-danger-text)]">Watchlist</p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {alerts.map((alert) => (
                <p
                  key={alert}
                  className="rounded-lg border border-[color:var(--status-danger-border)] bg-[var(--surface-panel)] px-3 py-2 text-sm text-[color:var(--status-danger-text)]"
                >
                  {alert}
                </p>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}
