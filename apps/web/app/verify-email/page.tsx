"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import api from "@/lib/http-client";

export default function VerifyEmailPage() {
  const [token, setToken] = useState("");
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
    </main>
  );
}
