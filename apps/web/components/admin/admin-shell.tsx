import Link from "next/link";
import { ReactNode } from "react";

export type AdminTabKey = "overview" | "rag-sources" | "knowledge-sources" | "answer-flow" | "observability";

type AdminShellProps = {
  activeTab: AdminTabKey;
  title: string;
  description: string;
  children: ReactNode;
};

const ADMIN_TABS: Array<{ key: AdminTabKey; href: string; label: string }> = [
  { key: "overview", href: "/admin/overview", label: "Overview" },
  { key: "rag-sources", href: "/admin/rag-sources", label: "RAG Sources" },
  { key: "knowledge-sources", href: "/admin/knowledge-sources", label: "Knowledge" },
  { key: "answer-flow", href: "/admin/answer-flow", label: "Answer Flow" },
  { key: "observability", href: "/admin/observability", label: "Observability" }
];

export default function AdminShell({ activeTab, title, description, children }: AdminShellProps) {
  return (
    <div className="space-y-6">
      <section
        className="relative overflow-hidden rounded-[2rem] border border-sky-200/80 bg-gradient-to-br from-white/90 via-slate-50/85 to-cyan-50/70 p-6 shadow-float dark:border-sky-800/45 dark:from-slate-900/90 dark:via-slate-900/75 dark:to-sky-950/45"
        aria-labelledby="admin-shell-title"
        aria-describedby="admin-shell-description"
      >
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-gradient-to-br from-sky-300/45 to-cyan-300/25 blur-3xl dark:from-sky-700/30 dark:to-cyan-700/20" />
        <div className="pointer-events-none absolute -bottom-20 -left-14 h-56 w-64 rounded-full bg-gradient-to-tr from-blue-300/25 to-cyan-200/20 blur-3xl dark:from-blue-700/25 dark:to-cyan-700/15" />

        <p className="inline-flex rounded-full border border-sky-200/70 bg-white/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700 dark:border-sky-700/45 dark:bg-slate-900/80 dark:text-sky-200">
          Admin Control Plane
        </p>

        <div className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <h2 id="admin-shell-title" className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-[2.15rem] dark:text-slate-100">
              {title}
            </h2>
            <p id="admin-shell-description" className="mt-2 max-w-3xl text-base leading-7 text-slate-700 dark:text-slate-300">
              {description}
            </p>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-sky-200/70 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80">
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">Config Endpoint</p>
              <p className="mt-1 text-sm font-mono text-slate-800 dark:text-slate-100">/system/control-tower/config</p>
            </div>
            <div className="rounded-2xl border border-sky-200/70 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80">
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-slate-500 dark:text-slate-400">Surface</p>
              <p className="mt-1 text-sm font-mono text-slate-800 dark:text-slate-100">RAG + Answer Flow + Runtime</p>
            </div>
          </div>
        </div>
      </section>

      <nav
        className="rounded-[1.4rem] border border-slate-200/90 bg-white/85 p-2.5 shadow-soft dark:border-slate-700 dark:bg-slate-900/85"
        aria-label="Admin navigation"
      >
        <ul className="flex w-max min-w-full gap-2.5 overflow-x-auto pb-1 sm:grid sm:w-full sm:grid-cols-5 sm:overflow-visible sm:pb-0">
          {ADMIN_TABS.map((tab, index) => {
            const isActive = tab.key === activeTab;
            return (
              <li key={tab.key} className="min-w-[9.6rem] sm:min-w-0">
                <Link
                  href={tab.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "flex min-h-12 items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900",
                    isActive
                      ? "border-sky-500 bg-sky-100/85 text-sky-800 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.22)] dark:border-sky-500 dark:bg-sky-950/50 dark:text-sky-100"
                      : "border-slate-200 bg-slate-50/90 text-slate-700 hover:border-slate-300 hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-900 dark:hover:text-slate-100"
                  ].join(" ")}
                >
                  <span>{tab.label}</span>
                  <span
                    className={[
                      "inline-flex min-w-[1.65rem] items-center justify-center rounded-lg px-1.5 py-0.5 text-[11px] font-semibold",
                      isActive ? "bg-sky-200 text-sky-800 dark:bg-sky-900/70 dark:text-sky-200" : "bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-300"
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    0{index + 1}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {children}
    </div>
  );
}
