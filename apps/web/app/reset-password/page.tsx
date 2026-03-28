"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import api from "@/lib/http-client";
import AuthFormShell from "@/components/auth-form-shell";
import AuthField from "@/components/auth/auth-field";
import AuthFeedback from "@/components/auth/auth-feedback";

export default function ResetPasswordPage() {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token") ?? "";
    if (tokenFromUrl) setToken(tokenFromUrl);
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setNotice("");
    setError("");
    try {
      await api.post("/auth/reset-password", { token, new_password: newPassword });
      setNotice("Đặt lại mật khẩu thành công. Bạn có thể đăng nhập lại.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể đặt lại mật khẩu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormShell title="Đặt lại mật khẩu" subtitle="Nhập mã đặt lại và mật khẩu mới để tiếp tục sử dụng tài khoản.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <AuthField
          id="reset-token"
          label="Mã đặt lại mật khẩu"
          as="textarea"
          rows={3}
          value={token}
          onChange={setToken}
          placeholder="Dán mã đặt lại tại đây"
          required
        />

        <AuthField
          id="reset-new-password"
          label="Mật khẩu mới"
          type="password"
          value={newPassword}
          onChange={setNewPassword}
          placeholder="Tối thiểu 8 ký tự"
          minLength={8}
          required
        />

        <AuthFeedback notice={notice} error={error} />

        {notice ? (
          <Link href="/login" className="inline-block text-sm font-medium text-blue-700 hover:underline">
            Đi đến đăng nhập
          </Link>
        ) : null}

        <button className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang xử lý..." : "Đặt lại mật khẩu"}
        </button>
      </form>
    </AuthFormShell>
  );
}
