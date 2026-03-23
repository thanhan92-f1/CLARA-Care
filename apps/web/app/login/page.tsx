"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/http-client";
import { setAccessToken, setRefreshToken, setRole as setStoredRole } from "@/lib/auth-store";
import { UserRole } from "@/lib/auth/roles";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("normal");
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
      const serverRole = response.data?.role as UserRole | undefined;

      if (!accessToken || !refreshToken) {
        throw new Error("Phản hồi đăng nhập thiếu token.");
      }

      const nextRole = serverRole ?? role;
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
        <select
          className="w-full rounded border p-2"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
        >
          <option value="normal">Normal User</option>
          <option value="researcher">Researcher</option>
          <option value="doctor">Doctor</option>
        </select>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button className="w-full rounded bg-primary px-4 py-2 text-white disabled:opacity-70" disabled={isSubmitting} type="submit">
          {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </main>
  );
}
