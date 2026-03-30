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
  const [themePreference, setThemePreference] = useState<ThemePreference>("dark");

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
    <div className="chrome-shell min-h-screen bg-[var(--color-bg)] text-[var(--text-primary)]">
      <div
        className={[
          "relative z-[1] mx-auto flex min-h-screen w-full",
          isWideWorkspace ? "max-w-[2520px]" : "max-w-[1840px]"
        ].join(" ")}
      >
        <SidebarNav role={role} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 px-[var(--workspace-gutter)] pb-2 pt-3 sm:px-[var(--workspace-gutter-lg)] sm:pt-4 lg:px-[var(--workspace-gutter-2xl)]">
            <div className="chrome-panel rounded-[22px] px-4 py-4 sm:px-5 sm:py-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    Workspace
                  </p>
                  <h1 className="mt-1.5 text-xl font-semibold leading-tight text-[var(--text-primary)] sm:text-[1.65rem]">
                    {currentPage.title}
                  </h1>
                  <p className="mt-1.5 max-w-[72ch] text-sm leading-relaxed text-[var(--text-secondary)] sm:text-[15px]">
                    {currentPage.subtitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2.5 sm:gap-3">
                  <div className="inline-flex min-h-12 items-center rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.32)]">
                    {THEME_OPTIONS.map((option) => {
                      const active = themePreference === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleThemeChange(option.value)}
                          aria-pressed={active}
                          className={`min-h-[44px] min-w-[76px] rounded-xl border px-3.5 py-2 text-sm font-semibold transition chrome-nav-link ${
                            active
                              ? "border-[color:var(--shell-border-strong)] bg-[var(--surface-brand-soft)] text-[var(--text-brand)] shadow-[0_10px_24px_-18px_rgba(2,132,199,0.95)]"
                              : "border-transparent text-[var(--text-secondary)] hover:border-[color:var(--shell-border)] hover:bg-[var(--surface-muted)]"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>

                  <span className="inline-flex min-h-[44px] items-center rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)]">
                    {ROLE_LABELS[role]}
                  </span>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-[var(--workspace-gutter)] pb-[calc(env(safe-area-inset-bottom,0px)+7.5rem)] pt-[var(--workspace-gutter)] sm:px-[var(--workspace-gutter-lg)] sm:pb-32 sm:pt-[var(--workspace-gutter-lg)] lg:px-[var(--workspace-gutter-2xl)] lg:pb-10 lg:pt-[var(--workspace-gutter-lg)]">
            <div
              className={[
                "w-full",
                isWideWorkspace ? "max-w-none" : "mx-auto max-w-[1360px]"
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
