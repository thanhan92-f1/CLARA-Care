"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import api from "@/lib/http-client";
import AuthFormShell from "@/components/auth-form-shell";
import AuthField from "@/components/auth/auth-field";
import AuthFeedback from "@/components/auth/auth-feedback";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenPreview, setTokenPreview] = useState("");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setNotice("");
    setTokenPreview("");
    try {
      const response = await api.post("/auth/forgot-password", { email });
      const token = response.data?.reset_token_preview as string | undefined;
      const deliveryStatus = (response.data?.email_delivery_status as string | undefined) ?? "";
      if (token) {
        setTokenPreview(token);
        setNotice("Yêu cầu đặt lại mật khẩu đã được tạo (chế độ dev).");
      } else if (deliveryStatus === "sent") {
        setNotice("Hệ thống đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.");
      } else {
        setNotice("Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể xử lý yêu cầu.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthFormShell title="Quên mật khẩu" subtitle="Nhập email tài khoản để nhận hướng dẫn đặt lại mật khẩu.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <AuthField
          id="forgot-email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="name@example.com"
          required
        />

        <AuthFeedback notice={notice} error={error} />

        {tokenPreview ? (
          <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            Mã reset (dev): <code className="font-mono text-xs">{tokenPreview}</code>{" "}
            <Link href={`/reset-password?token=${encodeURIComponent(tokenPreview)}`} className="font-medium text-blue-700 hover:underline">
              Mở trang đặt lại
            </Link>
          </p>
        ) : null}

        <button className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
        </button>

        <Link href="/login" className="inline-block text-sm text-slate-600 hover:underline">
          Quay lại đăng nhập
        </Link>
      </form>
    </AuthFormShell>
  );
}
