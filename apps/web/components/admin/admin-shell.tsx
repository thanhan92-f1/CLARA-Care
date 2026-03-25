import Link from "next/link";
import { ReactNode } from "react";

export type AdminTabKey = "overview" | "rag-sources" | "answer-flow" | "observability";

type AdminShellProps = {
  activeTab: AdminTabKey;
  title: string;
  description: string;
  children: ReactNode;
};

const ADMIN_TABS: Array<{ key: AdminTabKey; href: string; label: string }> = [
  { key: "overview", href: "/admin/overview", label: "Overview" },
  { key: "rag-sources", href: "/admin/rag-sources", label: "RAG Sources" },
  { key: "answer-flow", href: "/admin/answer-flow", label: "Answer Flow" },
  { key: "observability", href: "/admin/observability", label: "Observability" }
];

export default function AdminShell({ activeTab, title, description, children }: AdminShellProps) {
  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/70 to-sky-50/50 p-5 shadow-sm">
        <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-gradient-to-br from-sky-200/70 to-cyan-100/40 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-8 h-32 w-44 rounded-full bg-gradient-to-tr from-slate-200/40 to-sky-100/30 blur-2xl" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Admin Control Plane</p>
        <div className="mt-2 grid gap-4 lg:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">{description}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Config Endpoint</p>
              <p className="mt-1 text-xs font-mono text-slate-700">/system/control-tower/config</p>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Surface</p>
              <p className="mt-1 text-xs font-mono text-slate-700">RAG + Answer Flow + Runtime</p>
            </div>
          </div>
        </div>
      </section>

      <nav className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <ul className="grid gap-2 sm:grid-cols-4">
          {ADMIN_TABS.map((tab, index) => {
            const isActive = tab.key === activeTab;
            return (
              <li key={tab.key}>
                <Link
                  href={tab.href}
                  className={[
                    "flex items-center justify-between rounded-xl border px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                    isActive
                      ? "border-sky-500 bg-sky-50 text-sky-700 shadow-[inset_0_0_0_1px_rgba(14,165,233,0.15)]"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-900"
                  ].join(" ")}
                >
                  <span>{tab.label}</span>
                  <span
                    className={[
                      "inline-flex min-w-[1.5rem] items-center justify-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold",
                      isActive ? "bg-sky-100 text-sky-700" : "bg-slate-200/70 text-slate-600"
                    ].join(" ")}
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
