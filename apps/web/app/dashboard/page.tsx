"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import PageShell from "@/components/ui/page-shell";
import { UserRole, getRole } from "@/lib/auth-store";
import api from "@/lib/http-client";
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
  full_name?: string;
  role?: string;
};

const ROLE_LABELS: Record<UserRole, string> = {
  normal: "Người dùng cá nhân",
  researcher: "Nhà nghiên cứu",
  doctor: "Bác sĩ",
  admin: "Quản trị hệ thống"
};

const QUICK_INTENTS: Array<{ href: string; label: string; detail: string }> = [
  { href: "/selfmed/add", label: "Thêm thuốc mới", detail: "Nhập tay hoặc OCR để cập nhật tủ thuốc" },
  { href: "/careguard", label: "Check tương tác thuốc", detail: "Phân tích nhanh DDI theo danh sách hiện tại" },
  { href: "/research", label: "Hỏi đáp chuyên sâu", detail: "Tra cứu evidence và tóm tắt cho gia đình" },
  { href: "/selfmed", label: "Xem tủ thuốc", detail: "Rà soát thuốc sắp hết hạn hoặc cần thay" }
];

const MODULE_LINKS = [
  { href: "/selfmed", label: "Tủ thuốc cá nhân", description: "Theo dõi thuốc đang dùng và hạn sử dụng." },
  { href: "/careguard", label: "DDI Safe", description: "Cảnh báo tương tác thuốc theo thời gian thực." },
  { href: "/research", label: "CLARA Research", description: "Truy xuất evidence và giải thích dễ hiểu." },
  { href: "/scribe", label: "Scribe", description: "Tạo ghi chú SOAP nhanh cho buổi khám." },
  { href: "/council", label: "Hội chẩn", description: "Điều phối thảo luận đa chuyên khoa." },
  { href: "/admin/overview", label: "Admin Overview", description: "Quan sát nguồn dữ liệu và runtime flow." }
];

function formatCount(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "--";
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value);
}

function formatLatencyMs(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "--";
  return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(value)} ms`;
}

function getErrorText(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
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

function toneFromStatus(value: string): {
  label: string;
  badgeClass: string;
  panelClass: string;
} {
  const status = value.toLowerCase();

  if (["ok", "healthy", "up", "pass", "ready"].some((token) => status.includes(token))) {
    return {
      label: "Ổn định",
      badgeClass: "text-emerald-700 bg-emerald-100 border-emerald-200",
      panelClass: "border-emerald-200/70 bg-emerald-50/70"
    };
  }

  if (["warn", "warning", "degraded", "slow", "unstable"].some((token) => status.includes(token))) {
    return {
      label: "Suy giảm",
      badgeClass: "text-amber-700 bg-amber-100 border-amber-200",
      panelClass: "border-amber-200/70 bg-amber-50/70"
    };
  }

  if (["down", "fail", "error", "critical", "unhealthy"].some((token) => status.includes(token))) {
    return {
      label: "Cảnh báo",
      badgeClass: "text-rose-700 bg-rose-100 border-rose-200",
      panelClass: "border-rose-200/70 bg-rose-50/70"
    };
  }

  return {
    label: "Chưa xác định",
    badgeClass: "text-slate-700 bg-slate-100 border-slate-200",
    panelClass: "border-[color:var(--shell-border)] bg-[var(--surface-panel)]"
  };
}

export default function DashboardPage() {
  const [role, setRole] = useState<UserRole>("normal");
  const [displayName, setDisplayName] = useState("bạn");
  const [userSubject, setUserSubject] = useState<string>("");

  const [healthStatus, setHealthStatus] = useState("unknown");
  const [healthMessage, setHealthMessage] = useState("Chưa có dữ liệu health.");
  const [healthError, setHealthError] = useState("");

  const [requestCount, setRequestCount] = useState<number | null>(null);
  const [errorCount, setErrorCount] = useState<number | null>(null);
  const [avgLatencyMs, setAvgLatencyMs] = useState<number | null>(null);
  const [metricsError, setMetricsError] = useState("");

  const [mlStatus, setMlStatus] = useState("unknown");
  const [mlReachable, setMlReachable] = useState<boolean | null>(null);
  const [dependenciesError, setDependenciesError] = useState("");

  const [cabinetCount, setCabinetCount] = useState<number | null>(null);
  const [expiringSoonCount, setExpiringSoonCount] = useState<number | null>(null);
  const [expiredCount, setExpiredCount] = useState<number | null>(null);
  const [ocrCount, setOcrCount] = useState<number | null>(null);
  const [cabinetError, setCabinetError] = useState("");

  const [checkedAt, setCheckedAt] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const roleLabel = useMemo(() => ROLE_LABELS[role] ?? "Người dùng cá nhân", [role]);
  const greeting = getGreeting(new Date());

  const onRefreshSystem = useCallback(async () => {
    setIsRefreshing(true);
    setHealthError("");
    setMetricsError("");
    setDependenciesError("");
    setCabinetError("");

    try {
      const [
        healthResult,
        metricsResult,
        dependenciesResult,
        cabinetResult,
        meResult
      ] = await Promise.allSettled([
        getApiHealth(),
        getSystemMetrics(),
        getSystemDependencies(),
        getCabinet(),
        api.get<AuthMePayload>("/auth/me")
      ]);

      if (healthResult.status === "fulfilled") {
        const health = normalizeApiHealth(healthResult.value);
        setHealthStatus(health.status);
        setHealthMessage(health.message);
      } else {
        setHealthError(getErrorText(healthResult.reason, "Không thể lấy trạng thái sức khỏe API."));
      }

      if (metricsResult.status === "fulfilled") {
        const metrics = normalizeSystemMetrics(metricsResult.value);
        setRequestCount(metrics.requestCount);
        setErrorCount(metrics.errorCount);
        setAvgLatencyMs(metrics.avgLatencyMs);
      } else {
        setMetricsError(getErrorText(metricsResult.reason, "Không thể lấy số liệu hệ thống."));
      }

      if (dependenciesResult.status === "fulfilled") {
        const dependencies = normalizeSystemDependencies(dependenciesResult.value);
        setMlStatus(dependencies.mlStatus);
        setMlReachable(dependencies.mlReachable);
      } else {
        setDependenciesError(getErrorText(dependenciesResult.reason, "Không thể lấy trạng thái phụ thuộc hệ thống."));
      }

      if (cabinetResult.status === "fulfilled") {
        const items = cabinetResult.value.items ?? [];
        const now = Date.now();
        const dayMs = 24 * 60 * 60 * 1000;
        const soonBoundary = now + 30 * dayMs;
        let soon = 0;
        let expired = 0;

        items.forEach((item) => {
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
        setOcrCount(items.filter((item) => item.source === "ocr").length);
      } else {
        setCabinetError(getErrorText(cabinetResult.reason, "Không thể tải dữ liệu tủ thuốc."));
      }

      if (meResult.status === "fulfilled") {
        const payload = meResult.value.data ?? {};
        const subject = payload.subject ?? "";
        const fullName = payload.full_name?.trim() ?? "";
        const inferredName = subject.includes("@") ? subject.split("@")[0] : "bạn";
        setDisplayName(fullName || inferredName || "bạn");
        setUserSubject(subject);
      }

      setCheckedAt(new Date().toLocaleString("vi-VN"));
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setRole(getRole());
    void onRefreshSystem();
  }, [onRefreshSystem]);

  const healthTone = useMemo(() => toneFromStatus(healthStatus), [healthStatus]);

  const mlStatusLabel =
    mlReachable === true
      ? "Có thể kết nối"
      : mlReachable === false
      ? "Mất kết nối"
      : mlStatus || "Không xác định";

  const mlTone = useMemo(() => {
    if (mlReachable === true) {
      return {
        label: "Sẵn sàng",
        badgeClass: "text-emerald-700 bg-emerald-100 border-emerald-200",
        panelClass: "border-emerald-200/70 bg-emerald-50/70"
      };
    }

    if (mlReachable === false) {
      return {
        label: "Mất kết nối",
        badgeClass: "text-rose-700 bg-rose-100 border-rose-200",
        panelClass: "border-rose-200/70 bg-rose-50/70"
      };
    }

    return toneFromStatus(mlStatus);
  }, [mlReachable, mlStatus]);

  const errorRate = useMemo(() => {
    if (requestCount === null || errorCount === null || requestCount <= 0) return "--";
    return `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format((errorCount / requestCount) * 100)}%`;
  }, [requestCount, errorCount]);

  const alerts = useMemo(
    () => [healthError, metricsError, dependenciesError, cabinetError].filter(Boolean),
    [healthError, metricsError, dependenciesError, cabinetError]
  );

  const medicationCards = [
    {
      label: "Thuốc đang quản lý",
      value: formatCount(cabinetCount),
      hint: "Tổng số thuốc hiện có trong tủ thuốc"
    },
    {
      label: "Sắp hết hạn (30 ngày)",
      value: formatCount(expiringSoonCount),
      hint: "Cần ưu tiên kiểm tra và thay thế"
    },
    {
      label: "Đã hết hạn",
      value: formatCount(expiredCount),
      hint: "Nên loại bỏ để tránh dùng nhầm"
    },
    {
      label: "Nhập từ OCR",
      value: formatCount(ocrCount),
      hint: "Bản ghi được thêm từ ảnh/toa thuốc"
    }
  ];

  const opsCards = [
    {
      label: "Tổng request",
      value: formatCount(requestCount),
      hint: "Khối lượng xử lý từ endpoint metrics"
    },
    {
      label: "Tổng lỗi",
      value: formatCount(errorCount),
      hint: "Số request lỗi trong cùng kỳ"
    },
    {
      label: "Latency trung bình",
      value: formatLatencyMs(avgLatencyMs),
      hint: "Độ trễ phản hồi API tổng hợp"
    },
    {
      label: "Error rate",
      value: errorRate,
      hint: "Tỉ lệ lỗi = lỗi / tổng request"
    }
  ];

  const todaySuggestions = useMemo(() => {
    const suggestions: string[] = [];
    if ((expiredCount ?? 0) > 0) suggestions.push("Có thuốc đã hết hạn, nên rà soát ngay trong SelfMed.");
    if ((expiringSoonCount ?? 0) > 0) suggestions.push("Một số thuốc sắp hết hạn trong 30 ngày tới.");
    if ((cabinetCount ?? 0) >= 2) suggestions.push("Bạn có thể chạy DDI Safe để kiểm tra tương tác mới nhất.");
    if ((cabinetCount ?? 0) === 0) suggestions.push("Bắt đầu bằng cách thêm thuốc đầu tiên vào tủ thuốc.");
    if (!suggestions.length) suggestions.push("Hệ thống ổn định. Bạn có thể cập nhật kế hoạch dùng thuốc hôm nay.");
    return suggestions;
  }, [cabinetCount, expiringSoonCount, expiredCount]);

  return (
    <PageShell
      title="Dashboard"
      description="Trung tâm điều phối hàng ngày cho CLARA: tủ thuốc, cảnh báo tương tác và tác vụ ưu tiên."
    >
      <div className="space-y-5 lg:space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-[color:var(--shell-border)] bg-[linear-gradient(120deg,rgba(2,132,199,0.10),rgba(15,23,42,0.08),rgba(13,148,136,0.08))] p-5 sm:p-6">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-sky-400/25 blur-3xl" />
          <div className="pointer-events-none absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-emerald-400/20 blur-3xl" />

          <div className="relative grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <div className="rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Daily Command Center</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)] sm:text-3xl">
                {greeting.title}, {displayName}
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{greeting.subtitle}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  Vai trò: {roleLabel}
                </span>
                {userSubject ? (
                  <span className="inline-flex items-center rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                    {userSubject}
                  </span>
                ) : null}
                <span className="inline-flex items-center rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  {checkedAt ? `Cập nhật: ${checkedAt}` : "Đang đồng bộ dữ liệu..."}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-sky-600 bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
                  onClick={onRefreshSystem}
                  disabled={isRefreshing}
                >
                  {isRefreshing ? "Đang làm mới..." : "Làm mới trạng thái"}
                </button>
                <Link
                  href="/role-select"
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-[color:var(--shell-border)] bg-[var(--surface-panel)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--surface-muted)]"
                >
                  Đổi vai trò
                </Link>
              </div>
            </div>

            <aside className="rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-4 sm:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">Bạn muốn làm gì hôm nay?</p>
              <div className="mt-3 space-y-2">
                {QUICK_INTENTS.map((intent) => (
                  <Link
                    key={intent.href}
                    href={intent.href}
                    className="block rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-2 transition hover:border-[color:var(--shell-border-strong)] hover:bg-[var(--surface-brand-soft)]"
                  >
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{intent.label}</p>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">{intent.detail}</p>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          {medicationCards.map((item) => (
            <article
              key={item.label}
              className="rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-4 transition hover:border-[color:var(--shell-border-strong)]"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{item.label}</p>
              <p className="mt-2 font-mono text-2xl font-semibold text-[var(--text-primary)]">{item.value}</p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">{item.hint}</p>
            </article>
          ))}
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
          <div className="rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Action Matrix</p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">Các module chính</h3>
              </div>
              <span className="rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                {MODULE_LINKS.length} module
              </span>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {MODULE_LINKS.map((module, index) => (
                <Link
                  key={module.href}
                  href={module.href}
                  className="group rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-3 transition hover:-translate-y-0.5 hover:border-[color:var(--shell-border-strong)] hover:bg-[var(--surface-brand-soft)]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-2 py-0.5 font-mono text-xs text-[var(--text-secondary)]">
                      #{String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-sm text-[var(--text-muted)] transition group-hover:translate-x-0.5">→</span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{module.label}</p>
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">{module.description}</p>
                </Link>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <section className={`rounded-2xl border p-4 ${healthTone.panelClass}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">API Health</p>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${healthTone.badgeClass}`}>
                  {healthTone.label}
                </span>
              </div>
              <p className="mt-2 font-mono text-sm font-semibold text-[var(--text-primary)]">{healthStatus}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">{healthMessage}</p>
            </section>

            <section className={`rounded-2xl border p-4 ${mlTone.panelClass}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">ML Dependency</p>
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${mlTone.badgeClass}`}>
                  {mlTone.label}
                </span>
              </div>
              <p className="mt-2 font-mono text-sm font-semibold text-[var(--text-primary)]">{mlStatusLabel}</p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">Trạng thái kết nối tới dịch vụ ML runtime.</p>
            </section>
          </aside>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
          <div className="rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">System Metrics</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {opsCards.map((item) => (
                <article
                  key={item.label}
                  className="rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] p-3"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{item.label}</p>
                  <p className="mt-2 font-mono text-xl font-semibold text-[var(--text-primary)]">{item.value}</p>
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">{item.hint}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-4 sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Today Focus</p>
            <div className="mt-3 space-y-2">
              {todaySuggestions.map((suggestion) => (
                <p
                  key={suggestion}
                  className="rounded-lg border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-secondary)]"
                >
                  {suggestion}
                </p>
              ))}
            </div>
          </div>
        </section>

        {alerts.length > 0 ? (
          <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-700">Watchlist</p>
            <div className="mt-3 space-y-2">
              {alerts.map((alert) => (
                <p key={alert} className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm text-rose-700">
                  {alert}
                </p>
              ))}
            </div>
          </section>
        ) : (
          <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">Không có cảnh báo đồng bộ từ health, metrics, dependencies và tủ thuốc.</p>
          </section>
        )}
      </div>
    </PageShell>
  );
}
