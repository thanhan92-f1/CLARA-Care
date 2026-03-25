"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import api from "@/lib/http-client";

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
    <main className="mx-auto mt-20 max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Quên mật khẩu</h1>
      <p className="mt-2 text-sm text-slate-600">Nhập email để nhận liên kết đặt lại mật khẩu.</p>
      <form className="mt-4 space-y-3" onSubmit={onSubmit}>
        <input
          className="w-full rounded border p-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        {notice ? <p className="text-sm text-emerald-700">{notice}</p> : null}
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {tokenPreview ? (
          <p className="text-sm text-slate-700">
            Token dev: <code>{tokenPreview}</code>{" "}
            <Link href={`/reset-password?token=${encodeURIComponent(tokenPreview)}`} className="text-blue-600 hover:underline">
              Mở trang đặt lại
            </Link>
          </p>
        ) : null}
        <button className="w-full rounded bg-primary px-4 py-2 text-white disabled:opacity-70" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
        </button>
      </form>
    </main>
  );
}
