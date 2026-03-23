"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { getRole } from "@/lib/auth-store";
import type { UserRole } from "@/lib/auth/roles";

type NavItem = {
  href: string;
  label: string;
};

const NAV_BY_ROLE: Record<"normal" | "researcher" | "doctor", NavItem[]> = {
  normal: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/careguard", label: "CareGuard" },
    { href: "/scribe", label: "Scribe" }
  ],
  researcher: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/research", label: "Research" },
    { href: "/careguard", label: "CareGuard" }
  ],
  doctor: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/council", label: "AI Council" },
    { href: "/scribe", label: "Scribe" },
    { href: "/careguard", label: "CareGuard" },
    { href: "/research", label: "Research" }
  ]
};

export default function SidebarNav() {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole>("normal");

  useEffect(() => {
    setRole(getRole());
  }, []);

  const navItems = useMemo(() => NAV_BY_ROLE[role] ?? NAV_BY_ROLE.normal, [role]);

  return (
    <aside className="w-72 border-r border-slate-200 bg-white p-4">
      <div className="mb-6 rounded-lg bg-slate-900 px-3 py-2 text-white">
        <p className="text-xs uppercase tracking-wide text-slate-300">CLARA P0</p>
        <p className="text-lg font-semibold">Role: {role}</p>
      </div>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium transition ${
                isActive ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 border-t border-slate-200 pt-4">
        <Link href="/role-select" className="text-sm text-blue-600 hover:underline">
          Đổi vai trò người dùng
        </Link>
      </div>
    </aside>
  );
}
