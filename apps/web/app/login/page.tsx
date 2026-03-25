"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/http-client";
import { setAccessToken, setRefreshToken, setRole as setStoredRole } from "@/lib/auth-store";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await api.post("/auth/login", { email, password });
      const accessToken = response.data?.access_token as string | undefined;
      const refreshToken = response.data?.refresh_token as string | undefined;
      const serverRole = response.data?.role as "normal" | "researcher" | "doctor" | undefined;

      if (!accessToken || !refreshToken) {
        throw new Error("Phản hồi đăng nhập thiếu token.");
      }

      const nextRole = serverRole ?? "normal";
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setStoredRole(nextRole);
      router.push("/dashboard");
    } catch (submitError) {
      const fallbackMessage = "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.";
      if (submitError instanceof Error && submitError.message) {
        setError(submitError.message);
      } else {
        setError(fallbackMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto mt-20 max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-2xl font-semibold">Đăng nhập</h1>
      <p className="mb-3 text-sm text-slate-600">
        Nếu bạn mới sử dụng, hãy xem{" "}
        <Link href="/huong-dan" className="font-medium text-blue-600 hover:underline">
          hướng dẫn sử dụng
        </Link>{" "}
        trước khi bắt đầu.
      </p>
      <form className="space-y-3" onSubmit={onSubmit}>
        <input
          className="w-full rounded border p-2"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <input
          className="w-full rounded border p-2"
          placeholder="Mật khẩu"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button className="w-full rounded bg-primary px-4 py-2 text-white disabled:opacity-70" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
        <div className="flex justify-between text-sm">
          <Link href="/register" className="text-blue-600 hover:underline">
            Tạo tài khoản
          </Link>
          <Link href="/forgot-password" className="text-slate-600 hover:underline">
            Quên mật khẩu?
          </Link>
        </div>
      </form>
    </main>
  );
}
