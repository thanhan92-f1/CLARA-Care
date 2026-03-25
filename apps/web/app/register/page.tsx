"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/http-client";

type UserRole = "normal" | "researcher" | "doctor";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("normal");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSubmitting(true);
    try {
      const response = await api.post("/auth/register", {
        full_name: fullName,
        email,
        password,
        role
      });
      const tokenPreview = response.data?.verification_token_preview as string | undefined;
      if (tokenPreview) {
        setNotice(`Đăng ký thành công. Token xác thực (dev): ${tokenPreview}`);
      } else {
        setNotice("Đăng ký thành công. Bạn có thể đăng nhập ngay.");
      }
      setTimeout(() => router.push("/login"), 1000);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể tạo tài khoản.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto mt-20 max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-2xl font-semibold">Đăng ký tài khoản</h1>
      <p className="mb-3 text-sm text-slate-600">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:underline">
          Đăng nhập
        </Link>
      </p>
      <form className="space-y-3" onSubmit={onSubmit}>
        <input
          className="w-full rounded border p-2"
          placeholder="Họ và tên"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          required
        />
        <input
          className="w-full rounded border p-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className="w-full rounded border p-2"
          type="password"
          placeholder="Mật khẩu (>= 8 ký tự)"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
        <select className="w-full rounded border p-2" value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
          <option value="normal">Người dùng cá nhân</option>
          <option value="researcher">Nhà nghiên cứu</option>
          <option value="doctor">Bác sĩ</option>
        </select>
        {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button className="w-full rounded bg-primary px-4 py-2 text-white disabled:opacity-70" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Đang xử lý..." : "Tạo tài khoản"}
        </button>
      </form>
    </main>
  );
}
