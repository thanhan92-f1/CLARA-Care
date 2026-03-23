export type UserRole = "normal" | "researcher" | "doctor";

export const roleMenus: Record<UserRole, { label: string; href: string }[]> = {
  normal: [
    { label: "Dashboard", href: "/dashboard" },
    { label: "CareGuard", href: "/careguard" }
  ],
  researcher: [
    { label: "Research", href: "/research" },
    { label: "Dashboard", href: "/dashboard" }
  ],
  doctor: [
    { label: "Council", href: "/council" },
    { label: "Scribe", href: "/scribe" },
    { label: "CareGuard", href: "/careguard" }
  ]
};
