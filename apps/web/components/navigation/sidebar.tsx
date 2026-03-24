"use client";

import Link from "next/link";
import { useMemo } from "react";
import { roleMenus, UserRole } from "@/lib/auth/roles";

export default function Sidebar({ role }: { role: UserRole }) {
  const items = useMemo(() => roleMenus[role], [role]);

  return (
    <aside className="w-64 border-r border-slate-200 bg-white p-4">
      <h2 className="mb-4 text-lg font-semibold">CLARA (vai trò: {role})</h2>
      <nav className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
