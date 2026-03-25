"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import api from "@/lib/http-client";

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
        setNotice("Đã tạo token xác thực mới (chế độ dev). Vui lòng bấm Xác thực ngay.");
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
    <main className="mx-auto mt-20 max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Xác thực email</h1>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <textarea
          className="min-h-[84px] w-full rounded border p-2"
          placeholder="Token xác thực"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          required
        />
        {notice ? (
          <p className="text-sm text-emerald-700">
            {notice}{" "}
            <Link href="/login" className="text-blue-600 hover:underline">
              Đăng nhập
            </Link>
          </p>
        ) : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button className="w-full rounded bg-primary px-4 py-2 text-white disabled:opacity-70" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang xác thực..." : "Xác thực"}
        </button>
      </form>

      <div className="my-5 border-t border-slate-200" />

      <form className="space-y-3" onSubmit={onResend}>
        <p className="text-sm font-medium text-slate-900">Chưa có token hoặc chưa nhận được email?</p>
        <input
          className="w-full rounded border p-2"
          placeholder="Email tài khoản"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button
          className="w-full rounded border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100 disabled:opacity-70"
          type="submit"
          disabled={isResending}
        >
          {isResending ? "Đang gửi lại..." : "Gửi lại xác thực"}
        </button>
      </form>
    </main>
  );
}
