"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import PageShell from "@/components/ui/page-shell";
import {
  CareguardAnalyzeResult,
  analyzeCareguard,
  normalizeCareguardResult,
  parseLabsInput,
  parseFreeTextList
} from "@/lib/careguard";

type CabinetItem = {
  id: string;
  name: string;
  source: "manual" | "receipt";
  addedAt: string;
};

type ReceiptDetection = {
  name: string;
  confidence: number;
  evidence: string;
};

const CABINET_STORAGE_KEY = "clara:selfmed:cabinet:v1";

const DRUG_ALIAS_MAP: Record<string, string[]> = {
  paracetamol: ["paracetamol", "acetaminophen", "panadol", "hapacol", "efferalgan"],
  ibuprofen: ["ibuprofen", "advil", "brufen"],
  aspirin: ["aspirin"],
  warfarin: ["warfarin", "coumadin"],
  lisinopril: ["lisinopril"],
  metformin: ["metformin", "glucophage"],
  amoxicillin: ["amoxicillin", "augmentin"],
  omeprazole: ["omeprazole"],
  simvastatin: ["simvastatin"],
  loratadine: ["loratadine", "claritin"],
  cetirizine: ["cetirizine", "zyrtec"],
  vitamin_c: ["vitamin c", "ascorbic acid"]
};

const STEP_CARD_CLASS = "rounded-3xl border border-slate-200 bg-white p-4 shadow-sm";

function normalizeDrugName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function canonicalLabel(name: string): string {
  const map: Record<string, string> = {
    vitamin_c: "Vitamin C"
  };
  if (map[name]) return map[name];
  return name
    .split(" ")
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1))
    .join(" ");
}

function detectDrugsFromReceiptText(text: string): ReceiptDetection[] {
  const normalized = text.toLowerCase();
  const output: ReceiptDetection[] = [];

  Object.entries(DRUG_ALIAS_MAP).forEach(([canonical, aliases]) => {
    for (const alias of aliases) {
      const regex = new RegExp(`(^|[^a-z0-9])${alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`, "i");
      if (!regex.test(normalized)) continue;

      output.push({
        name: canonicalLabel(canonical.replace(/_/g, " ")),
        confidence: alias === canonical ? 0.94 : 0.82,
        evidence: alias
      });
      break;
    }
  });

  output.sort((a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name));
  return output;
}

function getRiskBadgeClass(riskTier: string | null): string {
  const value = riskTier?.toLowerCase() ?? "";
  if (value.includes("high") || value.includes("red")) return "border-red-200 bg-red-50 text-red-700";
  if (value.includes("medium") || value.includes("moderate") || value.includes("amber")) {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  if (value.includes("low") || value.includes("green")) return "border-emerald-200 bg-emerald-50 text-emerald-700";
  return "border-slate-200 bg-slate-50 text-slate-700";
}

function getRiskLabelVi(riskTier: string | null): string {
  const value = riskTier?.toLowerCase() ?? "";
  if (value.includes("high") || value.includes("red")) return "Cao";
  if (value.includes("medium") || value.includes("moderate") || value.includes("amber")) return "Trung bình";
  if (value.includes("low") || value.includes("green")) return "Thấp";
  return riskTier ?? "Chưa xác định";
}

function getRiskHelperText(riskTier: string | null): string {
  const value = riskTier?.toLowerCase() ?? "";
  if (value.includes("high") || value.includes("red")) {
    return "Nguy cơ tương tác cao. Không tự ý dùng đồng thời khi chưa hỏi bác sĩ/dược sĩ.";
  }
  if (value.includes("medium") || value.includes("moderate") || value.includes("amber")) {
    return "Có tương tác mức trung bình. Cần theo dõi triệu chứng và trao đổi chuyên môn nếu dùng kéo dài.";
  }
  if (value.includes("low") || value.includes("green")) {
    return "Nguy cơ thấp theo dữ liệu hiện tại. Vẫn nên dùng đúng liều và theo dõi phản ứng bất thường.";
  }
  return "Chưa đủ dữ liệu để kết luận mức rủi ro rõ ràng.";
}

function getSeverityLabelVi(severity: string | undefined): string {
  const value = severity?.toLowerCase() ?? "";
  if (value.includes("high") || value.includes("severe") || value.includes("red")) return "Nghiêm trọng";
  if (value.includes("medium") || value.includes("moderate") || value.includes("amber")) return "Trung bình";
  if (value.includes("low") || value.includes("mild") || value.includes("green")) return "Nhẹ";
  return severity ?? "Chưa rõ";
}

function getSeverityAdvice(severity: string | undefined): string {
  const value = severity?.toLowerCase() ?? "";
  if (value.includes("high") || value.includes("severe") || value.includes("red")) {
    return "Ưu tiên hỏi bác sĩ trước khi tiếp tục phối hợp các thuốc này.";
  }
  if (value.includes("medium") || value.includes("moderate") || value.includes("amber")) {
    return "Theo dõi dấu hiệu bất thường và tham khảo dược sĩ khi cần.";
  }
  return "Tiếp tục theo dõi phản ứng cơ thể trong quá trình dùng thuốc.";
}

function getSeverityToneClass(severity: string | undefined): string {
  const value = severity?.toLowerCase() ?? "";
  if (value.includes("high") || value.includes("severe") || value.includes("red")) {
    return "border-red-200 bg-red-50";
  }
  if (value.includes("medium") || value.includes("moderate") || value.includes("amber")) {
    return "border-amber-200 bg-amber-50";
  }
  return "border-emerald-200 bg-emerald-50";
}

function parseStorage(raw: string | null): CabinetItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const id = typeof item.id === "string" ? item.id : "";
        const name = typeof item.name === "string" ? item.name : "";
        const source = item.source === "receipt" ? "receipt" : "manual";
        const addedAt = typeof item.addedAt === "string" ? item.addedAt : new Date().toISOString();
        if (!id || !name) return null;
        return { id, name, source, addedAt } as CabinetItem;
      })
      .filter((item): item is CabinetItem => Boolean(item));
  } catch {
    return [];
  }
}

function uniqueMedicationNames(cabinet: CabinetItem[]): string[] {
  return Array.from(new Set(cabinet.map((item) => normalizeDrugName(item.name))));
}

function createCabinetItem(name: string, source: "manual" | "receipt"): CabinetItem {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.trim(),
    source,
    addedAt: new Date().toISOString()
  };
}

export default function CareguardPage() {
  const [symptomsInput, setSymptomsInput] = useState("");
  const [labsInput, setLabsInput] = useState("");
  const [allergiesInput, setAllergiesInput] = useState("");
  const [manualMedicationInput, setManualMedicationInput] = useState("");

  const [receiptTextInput, setReceiptTextInput] = useState("");
  const [receiptDetections, setReceiptDetections] = useState<ReceiptDetection[]>([]);
  const [receiptNotice, setReceiptNotice] = useState("");

  const [cabinet, setCabinet] = useState<CabinetItem[]>([]);
  const [cabinetNotice, setCabinetNotice] = useState("");
  const [cabinetError, setCabinetError] = useState("");

  const [autoResult, setAutoResult] = useState<CareguardAnalyzeResult | null>(null);
  const [manualResult, setManualResult] = useState<CareguardAnalyzeResult | null>(null);

  const [autoChecking, setAutoChecking] = useState(false);
  const [manualChecking, setManualChecking] = useState(false);
  const [autoError, setAutoError] = useState("");
  const [manualError, setManualError] = useState("");

  const cabinetMedicationNames = useMemo(() => uniqueMedicationNames(cabinet), [cabinet]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(CABINET_STORAGE_KEY);
    setCabinet(parseStorage(raw));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CABINET_STORAGE_KEY, JSON.stringify(cabinet));
  }, [cabinet]);

  useEffect(() => {
    let isCancelled = false;
    const allergies = parseFreeTextList(allergiesInput);

    if (cabinetMedicationNames.length === 0) {
      setAutoResult(null);
      setAutoError("");
      return;
    }

    const timeout = setTimeout(async () => {
      setAutoChecking(true);
      setAutoError("");
      try {
        const response = await analyzeCareguard({
          symptoms: [],
          labs: {},
          medications: cabinetMedicationNames,
          allergies
        });

        if (!isCancelled) {
          setAutoResult(normalizeCareguardResult(response));
        }
      } catch (cause) {
        if (!isCancelled) {
          setAutoError(cause instanceof Error ? cause.message : "Không thể tự động kiểm tra DDI.");
        }
      } finally {
        if (!isCancelled) {
          setAutoChecking(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [cabinetMedicationNames, allergiesInput]);

  const autoRiskClass = useMemo(() => getRiskBadgeClass(autoResult?.riskTier ?? null), [autoResult?.riskTier]);
  const manualRiskClass = useMemo(() => getRiskBadgeClass(manualResult?.riskTier ?? null), [manualResult?.riskTier]);
  const hasReceiptText = receiptTextInput.trim().length > 0;
  const stepProgress = useMemo(
    () => [
      {
        id: "01",
        title: "Nhận diện hóa đơn",
        helper: "Dán văn bản hoặc nạp tệp OCR.",
        done: receiptDetections.length > 0
      },
      {
        id: "02",
        title: "Xây tủ thuốc",
        helper: "Hợp nhất thuốc nhận diện và nhập tay.",
        done: cabinet.length > 0
      },
      {
        id: "03",
        title: "Auto DDI",
        helper: "Tự kiểm tra tương tác khi tủ thay đổi.",
        done: Boolean(autoResult)
      },
      {
        id: "04",
        title: "Phân tích nâng cao",
        helper: "Bổ sung triệu chứng và xét nghiệm khi cần.",
        done: Boolean(manualResult)
      }
    ],
    [autoResult, cabinet.length, manualResult, receiptDetections.length]
  );

  const onAddManualMedication = () => {
    setCabinetNotice("");
    setCabinetError("");

    const names = parseFreeTextList(manualMedicationInput);
    if (!names.length) {
      setCabinetError("Vui lòng nhập ít nhất 1 tên thuốc để thêm vào tủ thuốc.");
      return;
    }

    const normalizedSet = new Set(cabinet.map((item) => normalizeDrugName(item.name)));
    const nextItems = names
      .map((name) => name.trim())
      .filter(Boolean)
      .filter((name) => !normalizedSet.has(normalizeDrugName(name)))
      .map((name) => createCabinetItem(name, "manual"));

    if (!nextItems.length) {
      setCabinetError("Các thuốc này đã có trong tủ thuốc.");
      return;
    }

    setCabinet((current) => [...nextItems, ...current]);
    setManualMedicationInput("");
    setCabinetNotice(`Đã thêm ${nextItems.length} thuốc thủ công vào tủ thuốc.`);
  };

  const onRecognizeReceiptText = () => {
    const text = receiptTextInput.trim();
    if (!text) {
      setReceiptNotice("Vui lòng nhập nội dung hóa đơn trước khi nhận diện.");
      setReceiptDetections([]);
      return;
    }

    const detections = detectDrugsFromReceiptText(text);
    setReceiptDetections(detections);
    if (!detections.length) {
      setReceiptNotice("Chưa nhận diện được thuốc. Bạn có thể thêm thủ công ở bước 2.");
      return;
    }

    setReceiptNotice(`Nhận diện được ${detections.length} thuốc từ hóa đơn.`);
  };

  const onImportReceiptFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const mergedText = receiptTextInput ? `${receiptTextInput}\n${text}` : text;
      const detections = detectDrugsFromReceiptText(mergedText);

      setReceiptTextInput(mergedText);
      setReceiptDetections(detections);

      if (!detections.length) {
        setReceiptNotice("Đã nạp tệp nhưng chưa nhận diện được thuốc. Hãy kiểm tra lại nội dung OCR.");
      } else {
        setReceiptNotice(`Đã nạp tệp và nhận diện được ${detections.length} thuốc.`);
      }
    } catch {
      setReceiptNotice("Không thể đọc tệp này. Bạn vui lòng dán nội dung hóa đơn trực tiếp.");
    } finally {
      event.target.value = "";
    }
  };

  const onAddDetectedToCabinet = () => {
    setCabinetNotice("");
    setCabinetError("");

    if (!receiptDetections.length) {
      setCabinetError("Chưa có thuốc đã nhận diện để thêm vào tủ thuốc.");
      return;
    }

    const existing = new Set(cabinet.map((item) => normalizeDrugName(item.name)));
    const nextItems = receiptDetections
      .map((item) => item.name)
      .filter((name) => !existing.has(normalizeDrugName(name)))
      .map((name) => createCabinetItem(name, "receipt"));

    if (!nextItems.length) {
      setCabinetError("Các thuốc đã nhận diện đều đã có trong tủ thuốc.");
      return;
    }

    setCabinet((current) => [...nextItems, ...current]);
    setCabinetNotice(`Đã thêm ${nextItems.length} thuốc từ hóa đơn vào tủ thuốc.`);
  };

  const onRemoveCabinetItem = (id: string) => {
    setCabinet((current) => current.filter((item) => item.id !== id));
    setCabinetNotice("");
    setCabinetError("");
  };

  const onClearCabinet = () => {
    setCabinet([]);
    setCabinetNotice("");
    setCabinetError("");
    setAutoResult(null);
    setManualResult(null);
    setAutoError("");
  };

  const onRunManualAnalyze = async () => {
    const symptoms = parseFreeTextList(symptomsInput);
    const labs = parseLabsInput(labsInput);
    const allergies = parseFreeTextList(allergiesInput);

    if (!cabinetMedicationNames.length && !symptoms.length && Object.keys(labs).length === 0 && !allergies.length) {
      setManualError("Vui lòng nhập dữ liệu trước khi chạy phân tích nâng cao.");
      return;
    }

    setManualError("");
    setManualChecking(true);

    try {
      const response = await analyzeCareguard({
        symptoms,
        labs,
        medications: cabinetMedicationNames,
        allergies
      });
      setManualResult(normalizeCareguardResult(response));
    } catch (cause) {
      setManualError(cause instanceof Error ? cause.message : "Không thể chạy phân tích nâng cao.");
    } finally {
      setManualChecking(false);
    }
  };

  return (
    <PageShell title="Self-Med: dùng thuốc an toàn tại nhà" variant="plain">
      <div className="space-y-4">
        <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4 shadow-sm sm:p-5">
          <div className="space-y-2">
            <span className="inline-flex items-center rounded-full border border-sky-200 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-sky-700">
              CLARA Self-Med
            </span>
            <p className="text-sm leading-6 text-slate-700">
              Quy trình 4 bước: nhận diện thuốc từ hóa đơn, chuẩn hóa tủ thuốc, tự động kiểm tra tương tác và mở phân
              tích nâng cao khi cần thêm ngữ cảnh lâm sàng.
            </p>
          </div>

          <ol className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {stepProgress.map((step) => (
              <li
                key={step.id}
                className={`rounded-2xl border px-3 py-2 ${
                  step.done ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
                }`}
              >
                <p className={`text-xs font-semibold ${step.done ? "text-emerald-700" : "text-slate-500"}`}>B{step.id}</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{step.title}</p>
                <p className="mt-1 text-xs text-slate-600">{step.helper}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-3">
          <p className="text-sm text-indigo-800">
            Đã có module lưu tủ thuốc permanent theo tài khoản tại{" "}
            <Link href="/selfmed" className="font-semibold underline">
              trang Tủ thuốc cá nhân
            </Link>
            . Trang này tập trung workflow phân tích nâng cao.
          </p>
        </section>

        <section className={STEP_CARD_CLASS}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">B1. Nhận diện hóa đơn thuốc</h2>
              <p className="mt-1 text-xs text-slate-500">Hỗ trợ dán văn bản hoặc nạp tệp OCR để nhận diện nhanh.</p>
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              {receiptDetections.length} thuốc
            </span>
          </div>

          <textarea
            className="mt-3 h-28 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
            placeholder="Dán nội dung hóa đơn thuốc vào đây..."
            value={receiptTextInput}
            onChange={(event) => setReceiptTextInput(event.target.value)}
          />

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="file"
              onChange={onImportReceiptFile}
              className="max-w-full text-xs text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-2.5 file:py-1.5 file:text-xs file:font-medium file:text-slate-700"
            />
            <button
              type="button"
              onClick={onRecognizeReceiptText}
              className="rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              Nhận diện thuốc
            </button>
          </div>

          {receiptNotice ? <p className="mt-2 text-sm text-slate-600">{receiptNotice}</p> : null}

          {receiptDetections.length ? (
            <ul className="mt-3 space-y-2">
              {receiptDetections.map((item) => (
                <li
                  key={`${item.name}-${item.evidence}`}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
                >
                  <p className="font-medium text-slate-900">{item.name}</p>
                  <p className="text-xs text-slate-500">
                    khớp theo "{item.evidence}" | độ tin cậy {(item.confidence * 100).toFixed(0)}%
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              {hasReceiptText
                ? "Chưa nhận diện được thuốc từ nội dung hiện tại. Bạn có thể nhập lại hoặc bổ sung ở bước 2."
                : "Chưa có nội dung hóa đơn. Sau khi nhận diện được thuốc, chuyển sang bước 2 để thêm vào tủ thuốc."}
            </p>
          )}
        </section>

        <section className={STEP_CARD_CLASS}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">B2. Chuẩn hóa tủ thuốc</h2>
              <p className="mt-1 text-xs text-slate-500">Thêm từ hóa đơn hoặc nhập tay để hệ thống tự chạy DDI.</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                {cabinet.length} mục
              </span>
              {cabinet.length ? (
                <button
                  type="button"
                  onClick={onClearCabinet}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                >
                  Xóa toàn bộ
                </button>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onAddDetectedToCabinet}
              disabled={!receiptDetections.length}
              className="rounded-xl bg-primary px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              Thêm từ nhận diện ({receiptDetections.length})
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center">
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              placeholder="Ví dụ: Paracetamol, Ibuprofen"
              value={manualMedicationInput}
              onChange={(event) => setManualMedicationInput(event.target.value)}
            />
            <button
              type="button"
              onClick={onAddManualMedication}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Thêm thủ công
            </button>
          </div>

          {cabinetNotice ? (
            <p className="mt-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {cabinetNotice}
            </p>
          ) : null}
          {cabinetError ? (
            <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{cabinetError}</p>
          ) : null}

          {cabinet.length ? (
            <ul className="mt-3 space-y-2">
              {cabinet.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">
                      {item.source === "receipt" ? "Nguồn: Hóa đơn" : "Nguồn: Thủ công"} |{" "}
                      {new Date(item.addedAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveCabinetItem(item.id)}
                    className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700 transition hover:bg-slate-100"
                  >
                    Xóa
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              Tủ thuốc đang trống. Khi có ít nhất 1 thuốc, hệ thống sẽ tự động kiểm tra DDI ở bước 3.
            </p>
          )}
        </section>

        <section className={STEP_CARD_CLASS}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">B3. Tự động kiểm tra DDI</h2>
              <p className="mt-1 text-xs text-slate-500">
                Kết quả tự cập nhật mỗi khi danh sách thuốc hoặc thông tin dị ứng thay đổi.
              </p>
            </div>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold uppercase ${autoRiskClass}`}>
              {getRiskLabelVi(autoResult?.riskTier ?? null)}
            </span>
          </div>

          <label className="mt-3 block space-y-1">
            <span className="text-sm font-medium text-slate-700">Dị ứng thuốc (tùy chọn)</span>
            <input
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
              placeholder="Ví dụ: Penicillin, Aspirin"
              value={allergiesInput}
              onChange={(event) => setAllergiesInput(event.target.value)}
            />
            <span className="text-xs text-slate-500">Thông tin này được dùng cho cả kiểm tra tự động và phân tích nâng cao.</span>
          </label>

          {cabinet.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500">
              Chưa có thuốc trong tủ nên chưa thể kiểm tra tương tác.
            </p>
          ) : null}

          {autoChecking ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-sky-500" />
              Đang tự động kiểm tra tương tác thuốc...
            </p>
          ) : null}
          {autoError ? (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{autoError}</p>
          ) : null}

          {autoResult ? (
            <div className="mt-3 space-y-3">
              <article className={`rounded-2xl border px-3 py-3 ${autoRiskClass}`}>
                <p className="text-sm font-semibold">Tổng quan rủi ro: {getRiskLabelVi(autoResult.riskTier)}</p>
                <p className="mt-1 text-sm">{getRiskHelperText(autoResult.riskTier)}</p>
              </article>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-700">Cảnh báo tương tác</p>
                {autoResult.ddiAlerts.length ? (
                  <ul className="space-y-2">
                    {autoResult.ddiAlerts.map((alert, index) => (
                      <li
                        key={`${alert.title}-${index}`}
                        className={`rounded-xl border p-3 text-sm ${getSeverityToneClass(alert.severity)}`}
                      >
                        <p className="font-medium text-slate-800">{alert.title}</p>
                        <p className="mt-1 text-xs text-slate-600">Mức độ: {getSeverityLabelVi(alert.severity)}</p>
                        {alert.details ? <p className="mt-1 text-slate-700">{alert.details}</p> : null}
                        <p className="mt-1 text-xs text-slate-700">Gợi ý: {getSeverityAdvice(alert.severity)}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    Chưa ghi nhận tương tác nổi bật trong danh sách hiện tại.
                  </p>
                )}
              </div>
            </div>
          ) : !autoChecking && cabinet.length ? (
            <p className="mt-3 text-sm text-slate-600">Chưa có kết quả kiểm tra tự động.</p>
          ) : null}
        </section>

        <section className={STEP_CARD_CLASS}>
          <details>
            <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-slate-700">
              B4. Phân tích nâng cao (tùy chọn)
            </summary>

            <p className="mt-2 text-sm text-slate-600">
              Bổ sung triệu chứng và xét nghiệm để nhận khuyến nghị theo bối cảnh lâm sàng.
            </p>

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Triệu chứng</span>
                <textarea
                  className="h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  placeholder="Sốt, ho, chóng mặt..."
                  value={symptomsInput}
                  onChange={(event) => setSymptomsInput(event.target.value)}
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-medium text-slate-700">Chỉ số xét nghiệm</span>
                <textarea
                  className="h-24 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100"
                  placeholder="egfr=28, creatinine=2.1"
                  value={labsInput}
                  onChange={(event) => setLabsInput(event.target.value)}
                />
              </label>
            </div>

            <button
              type="button"
              onClick={onRunManualAnalyze}
              disabled={manualChecking}
              className="mt-3 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {manualChecking ? "Đang phân tích..." : "Chạy phân tích nâng cao"}
            </button>

            {manualError ? (
              <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{manualError}</p>
            ) : null}

            {manualResult ? (
              <div className="mt-3 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-slate-700">Mức độ rủi ro</p>
                  <span className={`rounded-full border px-2 py-1 text-xs font-semibold uppercase ${manualRiskClass}`}>
                    {getRiskLabelVi(manualResult.riskTier)}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-700">Khuyến nghị</p>
                  {manualResult.recommendations.length ? (
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {manualResult.recommendations.map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-600">Chưa có khuyến nghị chi tiết.</p>
                  )}
                </div>
              </div>
            ) : null}
          </details>
        </section>
      </div>
    </PageShell>
  );
}
