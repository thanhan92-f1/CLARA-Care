"use client";

import { ReactNode, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import SidebarNav from "@/components/sidebar-nav";
import MobileBottomNav from "@/components/navigation/mobile-bottom-nav";
import { getRole } from "@/lib/auth-store";
import { getPageMeta, isPublicRoute, type UserRole } from "@/lib/navigation.config";
import {
  applyThemePreference,
  getStoredThemePreference,
  saveThemePreference,
  type ThemePreference
} from "@/lib/theme";

type Props = {
  children: ReactNode;
};

const ROLE_LABELS: Record<UserRole, string> = {
  normal: "Người dùng cá nhân",
  researcher: "Nhà nghiên cứu",
  doctor: "Bác sĩ",
  admin: "Quản trị hệ thống",
};

const THEME_OPTIONS: Array<{ value: ThemePreference; label: string }> = [
  { value: "light", label: "Sáng" },
  { value: "dark", label: "Tối" },
  { value: "system", label: "Hệ thống" },
];

const WIDE_WORKSPACE_PREFIXES = [
  "/admin",
  "/research",
  "/selfmed",
  "/careguard",
  "/dashboard",
  "/council",
  "/scribe",
];

export default function AppShell({ children }: Props) {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole>("normal");
  const [themePreference, setThemePreference] = useState<ThemePreference>("system");

  const hideSidebar = isPublicRoute(pathname);
  const isWideWorkspace = WIDE_WORKSPACE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  useEffect(() => {
    setRole(getRole());
  }, [pathname]);

  useEffect(() => {
    const stored = getStoredThemePreference();
    setThemePreference(stored);
    applyThemePreference(stored);
  }, []);

  useEffect(() => {
    if (themePreference !== "system") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyThemePreference("system");

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    }

    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, [themePreference]);

  const currentPage = useMemo(() => getPageMeta(pathname), [pathname]);

  const handleThemeChange = (nextTheme: ThemePreference) => {
    setThemePreference(nextTheme);
    saveThemePreference(nextTheme);
    applyThemePreference(nextTheme);
  };

  if (hideSidebar) {
    return <main className="min-h-screen bg-[var(--color-bg)] text-[var(--text-primary)]">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--text-primary)]">
      <div
        className={[
          "mx-auto flex min-h-screen w-full",
          isWideWorkspace ? "max-w-[2400px]" : "max-w-[1720px]"
        ].join(" ")}
      >
        <SidebarNav role={role} />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-[color:var(--shell-border)] bg-[var(--surface-header)] px-[var(--workspace-gutter)] py-3 backdrop-blur sm:px-[var(--workspace-gutter-lg)]">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Workspace</p>
                <h1 className="mt-1 text-lg font-semibold text-[var(--text-primary)] sm:text-xl">{currentPage.title}</h1>
                <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{currentPage.subtitle}</p>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="inline-flex rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-1">
                  {THEME_OPTIONS.map((option) => {
                    const active = themePreference === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleThemeChange(option.value)}
                        aria-pressed={active}
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition ${
                          active
                            ? "border-[color:var(--shell-border-strong)] bg-[var(--surface-brand-soft)] text-[var(--text-brand)]"
                            : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>

                <span className="rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                  {ROLE_LABELS[role]}
                </span>
              </div>
            </div>
          </header>

          <main className="flex-1 px-[var(--workspace-gutter)] pb-24 pt-[var(--workspace-gutter)] sm:px-[var(--workspace-gutter-lg)] sm:pb-24 sm:pt-[var(--workspace-gutter-lg)] lg:px-[var(--workspace-gutter-2xl)] lg:pb-8 lg:pt-[var(--workspace-gutter-lg)]">
            <div
              className={[
                "w-full",
                isWideWorkspace ? "max-w-none" : "mx-auto max-w-[1280px]"
              ].join(" ")}
            >
              {children}
            </div>
          </main>
        </div>
      </div>

      <MobileBottomNav role={role} />
    </div>
  );
}
