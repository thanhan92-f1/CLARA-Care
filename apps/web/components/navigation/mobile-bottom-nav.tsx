"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getMobilePrimaryNav, isActiveRoute, type UserRole } from "@/lib/navigation.config";

type MobileBottomNavProps = {
  role: UserRole;
};

export default function MobileBottomNav({ role }: MobileBottomNavProps) {
  const pathname = usePathname();
  const items = getMobilePrimaryNav(role);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/90 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom,0px)+8px)] pt-2 backdrop-blur lg:hidden">
      <ul className="mx-auto grid max-w-xl grid-cols-4 gap-1">
        {items.map((item) => {
          const active = isActiveRoute(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex min-h-12 flex-col items-center justify-center rounded-xl px-2 py-1 text-center ${
                  active ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="text-[11px] font-semibold leading-tight">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
