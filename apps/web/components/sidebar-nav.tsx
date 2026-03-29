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
    <aside className="sticky top-0 hidden h-screen w-80 shrink-0 border-r border-[color:var(--shell-border)] bg-[var(--surface-sidebar)] px-4 py-5 backdrop-blur lg:block">
      <div className="glass-card rounded-2xl px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-brand)]">CLARA Care</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Không gian làm việc</p>
            <p className="text-xs text-[var(--text-muted)]">Trải nghiệm đơn giản, rõ hành động</p>
          </div>
          <span className="rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-brand-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-brand)]">
            {ROLE_LABELS[role]}
          </span>
        </div>
      </div>

      {groups.map((group) => (
        <div key={group.key} className="mt-5">
          <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{group.label}</p>
          <nav className="space-y-2">
            {group.items.map((item) => {
              const active = isActiveRoute(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group block rounded-xl border px-3 py-2.5 transition ${
                    active
                      ? "border-[color:var(--shell-border-strong)] bg-[var(--surface-brand-soft)] shadow-sm"
                      : "border-transparent bg-[var(--surface-panel)] hover:border-[color:var(--shell-border)] hover:bg-[var(--surface-muted)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-semibold ${active ? "text-[var(--text-brand)]" : "text-[var(--text-primary)]"}`}>
                      {item.label}
                    </span>
                    <span
                      className={`h-2 w-2 rounded-full ${
                        active
                          ? "bg-[var(--text-brand)]"
                          : "bg-[var(--text-muted)]/60 group-hover:bg-[var(--text-muted)]"
                      }`}
                    />
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">{item.desc}</p>
                </Link>
              );
            })}
          </nav>
        </div>
      ))}

      <div className="mt-5 border-t border-[color:var(--shell-border)] pt-4">
        <Link href="/role-select" className="block rounded-lg px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]">
          Đổi vai trò
        </Link>
      </div>
    </aside>
  );
}
