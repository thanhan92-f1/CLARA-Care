"use client";

import { FormEvent, useMemo, useState } from "react";
import PageShell from "@/components/ui/page-shell";
import {
  CareguardAnalyzeResult,
  analyzeCareguard,
  normalizeCareguardResult,
  parseLabsInput,
  parseFreeTextList
} from "@/lib/careguard";

function getRiskBadgeClass(riskTier: string | null): string {
  const value = riskTier?.toLowerCase() ?? "";
  if (value.includes("high") || value.includes("red")) return "border-red-200 bg-red-50 text-red-700";
  if (value.includes("medium") || value.includes("moderate") || value.includes("amber")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (value.includes("low") || value.includes("green")) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

export default function CareguardPage() {
  const [symptomsInput, setSymptomsInput] = useState("");
  const [labsInput, setLabsInput] = useState("");
  const [medicationsInput, setMedicationsInput] = useState("");
  const [allergiesInput, setAllergiesInput] = useState("");

  const [result, setResult] = useState<CareguardAnalyzeResult | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const riskClass = useMemo(() => getRiskBadgeClass(result?.riskTier ?? null), [result?.riskTier]);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = {
      symptoms: parseFreeTextList(symptomsInput),
      labs: parseLabsInput(labsInput),
      medications: parseFreeTextList(medicationsInput),
      allergies: parseFreeTextList(allergiesInput)
    };

    if (
      payload.symptoms.length === 0 &&
      Object.keys(payload.labs).length === 0 &&
      payload.medications.length === 0 &&
      payload.allergies.length === 0
    ) {
      setError("Vui lòng nhập ít nhất một trường dữ liệu để phân tích.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    setResult(null);

    try {
      const response = await analyzeCareguard(payload);
      setResult(normalizeCareguardResult(response));
    } catch (submitError) {
      const fallbackMessage = "Không thể phân tích hồ sơ CareGuard. Vui lòng thử lại.";
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
    <PageShell title="Kiểm tra an toàn thuốc">
      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Nhập dữ liệu bệnh nhân (mỗi mục cách nhau bằng dấu phẩy hoặc xuống dòng) để nhận đánh giá rủi ro nhanh.
        </p>

        <form className="space-y-3" onSubmit={onSubmit}>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Triệu chứng</span>
              <textarea
                className="h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Sốt, ho kéo dài, khó thở..."
                value={symptomsInput}
                onChange={(event) => setSymptomsInput(event.target.value)}
                disabled={isSubmitting}
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Chỉ số xét nghiệm</span>
              <textarea
                className="h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="CRP tăng, AST/ALT..."
                value={labsInput}
                onChange={(event) => setLabsInput(event.target.value)}
                disabled={isSubmitting}
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Thuốc đang dùng</span>
              <textarea
                className="h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Warfarin, Clarithromycin..."
                value={medicationsInput}
                onChange={(event) => setMedicationsInput(event.target.value)}
                disabled={isSubmitting}
              />
            </label>

            <label className="space-y-1">
              <span className="text-sm font-medium text-slate-700">Tiền sử dị ứng</span>
              <textarea
                className="h-28 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Penicillin, NSAIDs..."
                value={allergiesInput}
                onChange={(event) => setAllergiesInput(event.target.value)}
                disabled={isSubmitting}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
            {isSubmitting ? "Đang phân tích..." : "Phân tích an toàn thuốc"}
          </button>
        </form>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
        ) : null}

        {result ? (
          <section className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-slate-700">Mức độ rủi ro</p>
              <span className={`rounded-full border px-2 py-1 text-xs font-semibold uppercase ${riskClass}`}>
                {result.riskTier ?? "Không xác định"}
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Cảnh báo tương tác thuốc (DDI)</p>
              {result.ddiAlerts.length ? (
                <ul className="space-y-2">
                  {result.ddiAlerts.map((alert, index) => (
                    <li key={`${alert.title}-${index}`} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
                      <p className="font-medium text-slate-800">{alert.title}</p>
                      {alert.severity ? <p className="text-xs uppercase text-slate-500">Mức độ: {alert.severity}</p> : null}
                      {alert.details ? <p className="mt-1 text-slate-600">{alert.details}</p> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600">Chưa có cảnh báo DDI trong phản hồi hiện tại.</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-slate-700">Khuyến nghị</p>
              {result.recommendations.length ? (
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {result.recommendations.map((item, index) => (
                    <li key={`${item}-${index}`}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-600">Chưa có khuyến nghị chi tiết.</p>
              )}
            </div>
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}
