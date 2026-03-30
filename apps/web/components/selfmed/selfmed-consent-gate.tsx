"use client";

import { ReactNode, useEffect, useState } from "react";
import { acceptConsent, getConsentStatus } from "@/lib/consent";

type SelfMedConsentGateProps = {
  children: ReactNode;
};

export default function SelfMedConsentGate({ children }: SelfMedConsentGateProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [requiredVersion, setRequiredVersion] = useState("");
  const [checked, setChecked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const refreshConsent = async (): Promise<boolean> => {
    setError("");
    try {
      const status = await getConsentStatus();
      setRequiredVersion(status.required_version);
      setAccepted(status.accepted);
      return status.accepted;
    } catch (cause) {
      setAccepted(false);
      setError(cause instanceof Error ? cause.message : "Không thể kiểm tra consent y tế.");
      return false;
    }
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await refreshConsent();
      setIsLoading(false);
    };
    void init();
  }, []);

  const onAccept = async () => {
    if (!requiredVersion) return;
    if (!checked) {
      setError("Vui lòng tick xác nhận trước khi tiếp tục.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      await acceptConsent({ consent_version: requiredVersion, accepted: true });
      setAccepted(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể lưu xác nhận consent.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <section className="chrome-panel rounded-[1.5rem] p-6">
        <p className="text-base font-semibold text-[var(--text-primary)]">Đang kiểm tra điều khoản sử dụng y tế...</p>
      </section>
    );
  }

  if (!accepted) {
    return (
      <section className="chrome-panel rounded-[1.5rem] border border-amber-300/60 p-6">
        <p className="inline-flex rounded-full border border-amber-300/55 bg-amber-100/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
          Bước bắt buộc trước khi dùng
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[var(--text-primary)]">Tuyên bố miễn trừ trách nhiệm y tế</h2>
        <p className="mt-3 max-w-4xl text-base leading-7 text-[var(--text-secondary)]">
          CLARA chỉ hỗ trợ cảnh báo an toàn thuốc và không thay thế bác sĩ. Không sử dụng ứng dụng để tự chẩn đoán,
          tự kê đơn hoặc tự điều chỉnh liều dùng.
        </p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Phiên bản điều khoản hiện tại: <span className="font-semibold">{requiredVersion || "-"}</span>
        </p>

        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] p-4">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => setChecked(event.target.checked)}
            className="mt-1 h-5 w-5 rounded border-[color:var(--shell-border)]"
          />
          <span className="text-sm font-medium leading-6 text-[var(--text-primary)]">
            Tôi đã đọc, hiểu và đồng ý với tuyên bố miễn trừ trách nhiệm y tế của CLARA.
          </span>
        </label>

        <button
          type="button"
          onClick={onAccept}
          disabled={isSaving || !checked}
          className="mt-4 min-h-12 rounded-xl border border-cyan-400/60 bg-cyan-500/20 px-5 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Đang lưu xác nhận..." : "Đồng ý và tiếp tục"}
        </button>

        {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      </section>
    );
  }

  return <>{children}</>;
}
