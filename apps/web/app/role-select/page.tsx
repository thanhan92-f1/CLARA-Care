"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { UserRole, setRole } from "@/lib/auth-store";
import { getRoleHomePath } from "@/lib/navigation.config";

const roles: Array<{ value: UserRole; label: string; description: string }> = [
  { value: "normal", label: "Người dùng cá nhân", description: "Tra cứu thông tin cơ bản và quản lý sức khỏe cá nhân." },
  { value: "researcher", label: "Nhà nghiên cứu", description: "Luồng nghiên cứu chuyên sâu, phản hồi có dẫn chứng." },
  { value: "doctor", label: "Bác sĩ", description: "Luồng lâm sàng chuyên biệt và hội chẩn AI." }
];

export default function RoleSelectionPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("normal");
  const router = useRouter();

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setRole(selectedRole);
    router.push(getRoleHomePath(selectedRole));
  };

  return (
    <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">Chọn vai trò người dùng</h1>
      <p className="mt-1 text-sm text-slate-600">Vai trò sẽ quyết định menu và workflow của bạn trong hệ thống.</p>

      <form className="mt-6 space-y-3" onSubmit={onSubmit}>
        {roles.map((role) => (
          <label key={role.value} className="flex cursor-pointer gap-3 rounded-lg border border-slate-200 p-3 hover:bg-slate-50">
            <input
              type="radio"
              name="role"
              value={role.value}
              checked={selectedRole === role.value}
              onChange={() => setSelectedRole(role.value)}
            />
            <div>
              <p className="font-medium">{role.label}</p>
              <p className="text-sm text-slate-600">{role.description}</p>
            </div>
          </label>
        ))}

        <button type="submit" className="mt-3 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Áp dụng vai trò
        </button>
      </form>
    </div>
  );
}
