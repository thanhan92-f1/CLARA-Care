"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getGroupedNavItems, isActiveRoute, type UserRole } from "@/lib/navigation.config";

type SidebarNavProps = {
  role: UserRole;
};

const ROLE_LABELS: Record<UserRole, string> = {
  normal: "Người dùng",
  researcher: "Nhà nghiên cứu",
  doctor: "Bác sĩ",
  admin: "Quản trị",
};

export default function SidebarNav({ role }: SidebarNavProps) {
  const pathname = usePathname();
  const groups = getGroupedNavItems(role);

  return (
    <aside className="chrome-panel sticky top-0 hidden h-screen w-[var(--shell-nav-width)] shrink-0 border-r border-[color:var(--shell-border)] px-4 py-5 lg:flex lg:flex-col lg:gap-1">
      <div className="glass-surface-2 rounded-3xl px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.19em] text-[var(--text-brand)]">CLARA Care</p>
        <div className="mt-2.5 flex items-start justify-between gap-3">
          <div>
            <p className="text-base font-semibold text-[var(--text-primary)]">Không gian làm việc</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--text-muted)]">Điều hướng nhanh, rõ hành động và dễ thao tác</p>
          </div>
          <span className="inline-flex min-h-[38px] items-center rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--text-brand)]">
            {ROLE_LABELS[role]}
          </span>
        </div>
      </div>

      <div className="mt-5 flex-1 space-y-5 overflow-y-auto pr-1">
        {groups.map((group) => (
          <div key={group.key}>
            <p className="mb-2.5 px-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">{group.label}</p>
            <nav className="space-y-2.5">
              {group.items.map((item) => {
                const active = isActiveRoute(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`chrome-nav-link group block rounded-2xl border px-4 py-3.5 transition ${
                      active
                        ? "border-[color:var(--shell-border-strong)] bg-[var(--surface-brand-soft)] shadow-[0_16px_30px_-26px_rgba(2,132,199,0.95)]"
                        : "border-transparent bg-[var(--surface-panel)] hover:border-[color:var(--shell-border)] hover:bg-[var(--surface-muted)]"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={`text-[15px] font-semibold leading-tight ${active ? "text-[var(--text-brand)]" : "text-[var(--text-primary)]"}`}>
                        {item.label}
                      </span>
                      <span
                        className={`h-2.5 w-2.5 rounded-full transition ${
                          active
                            ? "bg-[var(--text-brand)] shadow-[0_0_0_4px_rgba(14,116,205,0.14)]"
                            : "bg-[var(--text-muted)]/60 group-hover:bg-[var(--text-muted)]"
                        }`}
                      />
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-muted)]">{item.desc}</p>
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t border-[color:var(--shell-border)] pt-4">
        <Link
          href="/role-select"
          className="chrome-nav-link flex min-h-[46px] items-center rounded-xl border border-transparent px-4 text-sm font-medium text-[var(--text-secondary)] transition hover:border-[color:var(--shell-border)] hover:bg-[var(--surface-muted)]"
        >
          Đổi vai trò
        </Link>
      </div>
    </aside>
  );
}
