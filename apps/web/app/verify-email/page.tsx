"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import api from "@/lib/http-client";
import AuthFormShell from "@/components/auth-form-shell";
import AuthField from "@/components/auth/auth-field";
import AuthFeedback from "@/components/auth/auth-feedback";

export default function VerifyEmailPage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get("token") ?? "";
    const emailFromUrl = params.get("email") ?? "";
    if (tokenFromUrl) setToken(tokenFromUrl);
    if (emailFromUrl) setEmail(emailFromUrl);
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setNotice("");
    setError("");
    setIsSubmitting(true);
    try {
      await api.post("/auth/verify-email", { token });
      setNotice("Xác thực email thành công.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể xác thực email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResend = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("");
    setError("");
    setIsResending(true);
    try {
      const response = await api.post("/auth/resend-verification", { email });
      const tokenPreview = response.data?.verification_token_preview as string | undefined;
      const deliveryStatus = (response.data?.email_delivery_status as string | undefined) ?? "";
      if (tokenPreview) {
        setToken(tokenPreview);
        setNotice("Đã tạo mã xác thực mới (chế độ dev). Vui lòng bấm xác thực ngay.");
      } else if (deliveryStatus === "sent") {
        setNotice("Đã gửi lại email xác thực. Vui lòng kiểm tra hộp thư.");
      } else {
        setNotice("Nếu tài khoản chưa xác thực, hệ thống đã xử lý yêu cầu gửi lại.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể gửi lại email xác thực.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthFormShell title="Xác thực email" subtitle="Nhập mã xác thực hoặc yêu cầu gửi lại mã để kích hoạt tài khoản.">
      <form className="space-y-4" onSubmit={onSubmit}>
        <AuthField
          id="verify-token"
          label="Mã xác thực"
          as="textarea"
          rows={3}
          value={token}
          onChange={setToken}
          placeholder="Dán mã xác thực tại đây"
          required
        />

        <AuthFeedback notice={notice} error={error} />

        {notice ? (
          <Link href="/login" className="inline-block text-sm font-medium text-blue-700 hover:underline">
            Đi đến đăng nhập
          </Link>
        ) : null}

        <button className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang xác thực..." : "Xác thực email"}
        </button>
      </form>

      <div className="my-5 border-t border-slate-200" />

      <form className="space-y-4" onSubmit={onResend}>
        <AuthField
          id="verify-email"
          label="Email tài khoản"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="name@example.com"
          required
        />
        <button
          className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-70"
          type="submit"
          disabled={isResending}
        >
          {isResending ? "Đang gửi lại..." : "Gửi lại mã xác thực"}
        </button>
      </form>
    </AuthFormShell>
  );
}
