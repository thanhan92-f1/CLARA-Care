export type UserRole = "normal" | "researcher" | "doctor";

export const roleMenus: Record<UserRole, { label: string; href: string }[]> = {
  normal: [
    { label: "Bảng điều khiển", href: "/dashboard" },
    { label: "Kiểm tra an toàn thuốc", href: "/careguard" }
  ],
  researcher: [
    { label: "Không gian hỏi đáp nghiên cứu", href: "/research" },
    { label: "Bảng điều khiển", href: "/dashboard" }
  ],
  doctor: [
    { label: "Hội chẩn AI", href: "/council" },
    { label: "Trợ lý ghi chép y khoa", href: "/scribe" },
    { label: "Kiểm tra an toàn thuốc", href: "/careguard" }
  ]
};
