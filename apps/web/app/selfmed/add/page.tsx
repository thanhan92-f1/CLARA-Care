"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import PageShell from "@/components/ui/page-shell";
import SelfMedConsentGate from "@/components/selfmed/selfmed-consent-gate";
import { AddCabinetItemPayload, ScanDetection, addCabinetItem, importDetections, scanReceiptFile, scanReceiptText } from "@/lib/selfmed";

function confidenceClass(value: number): string {
  if (value >= 0.85) return "border-emerald-300/60 bg-emerald-500/15 text-emerald-100";
  if (value >= 0.6) return "border-amber-300/60 bg-amber-500/15 text-amber-100";
  return "border-red-300/60 bg-red-500/15 text-red-100";
}

export default function SelfMedAddPage() {
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanText, setScanText] = useState("");
  const [detections, setDetections] = useState<ScanDetection[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<Record<string, boolean>>({});
  const [scanNotice, setScanNotice] = useState("");
  const [isScanningFile, setIsScanningFile] = useState(false);
  const [isScanningText, setIsScanningText] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [manualDrugName, setManualDrugName] = useState("");
  const [manualDosage, setManualDosage] = useState("");
  const [manualQuantity, setManualQuantity] = useState("1");
  const [manualNotice, setManualNotice] = useState("");
  const [isAddingManual, setIsAddingManual] = useState(false);

  const selectedDetections = useMemo(
    () => detections.filter((item, index) => selectedKeys[`${item.normalized_name}-${index}`]),
    [detections, selectedKeys]
  );

  const resetSelection = (items: ScanDetection[]) => {
    const next: Record<string, boolean> = {};
    items.forEach((item, index) => {
      next[`${item.normalized_name}-${index}`] = true;
    });
    setSelectedKeys(next);
  };

  const onScanFile = async () => {
    if (!scanFile) {
      setScanNotice("Vui lòng chọn file ảnh/PDF đơn thuốc trước khi quét.");
      return;
    }

    setIsScanningFile(true);
    setScanNotice("");
    try {
      const found = await scanReceiptFile(scanFile);
      setDetections(found);
      resetSelection(found);
      setScanNotice(found.length ? `Nhận diện được ${found.length} thuốc từ file OCR.` : "Không nhận diện được thuốc từ file OCR.");
    } catch (cause) {
      setScanNotice(cause instanceof Error ? cause.message : "Không thể quét file OCR.");
    } finally {
      setIsScanningFile(false);
    }
  };

  const onScanText = async () => {
    const text = scanText.trim();
    if (!text) {
      setScanNotice("Vui lòng dán nội dung OCR trước khi quét.");
      return;
    }

    setIsScanningText(true);
    setScanNotice("");
    try {
      const found = await scanReceiptText(text);
      setDetections(found);
      resetSelection(found);
      setScanNotice(found.length ? `Nhận diện được ${found.length} thuốc từ nội dung dán.` : "Không nhận diện được thuốc từ nội dung dán.");
    } catch (cause) {
      setScanNotice(cause instanceof Error ? cause.message : "Không thể quét nội dung OCR.");
    } finally {
      setIsScanningText(false);
    }
  };

  const onImportSelected = async () => {
    if (!selectedDetections.length) return;
    setIsImporting(true);
    setScanNotice("");
    try {
      const inserted = await importDetections(selectedDetections);
      setScanNotice(`Đã thêm ${inserted} thuốc vào tủ thuốc.`);
    } catch (cause) {
      setScanNotice(cause instanceof Error ? cause.message : "Không thể nhập dữ liệu vào tủ thuốc.");
    } finally {
      setIsImporting(false);
    }
  };

  const onToggleDetection = (key: string) => {
    setSelectedKeys((current) => ({ ...current, [key]: !current[key] }));
  };

  const onAddManual = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setManualNotice("");
    setIsAddingManual(true);

    const payload: AddCabinetItemPayload = {
      drug_name: manualDrugName.trim(),
      dosage: manualDosage.trim(),
      quantity: Number.isFinite(Number(manualQuantity)) ? Number(manualQuantity) : 1,
      source: "manual"
    };

    try {
      await addCabinetItem(payload);
      setManualDrugName("");
      setManualDosage("");
      setManualQuantity("1");
      setManualNotice("Đã thêm thuốc thủ công vào tủ thuốc.");
    } catch (cause) {
      setManualNotice(cause instanceof Error ? cause.message : "Không thể thêm thuốc thủ công.");
    } finally {
      setIsAddingManual(false);
    }
  };

  return (
    <PageShell
      title="Thêm Thuốc"
      description="Upload đơn thuốc ở ô lớn phía trên, sau đó chọn OCR nhận diện hoặc nhập thủ công ở phần dưới."
    >
      <SelfMedConsentGate>
        <div className="space-y-5">
          <section className="chrome-panel rounded-[1.35rem] p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Bước 1</p>
                <h2 className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">Upload đơn thuốc / hóa đơn</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">Kéo thả hoặc chọn file, sau đó bấm &quot;Quét file OCR&quot;.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href="/selfmed"
                  className="inline-flex min-h-12 items-center rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--text-secondary)] transition hover:border-[color:var(--shell-border-strong)]"
                >
                  Về tủ thuốc
                </Link>
                <Link
                  href="/selfmed/ddi"
                  className="inline-flex min-h-12 items-center rounded-xl border border-indigo-300/55 bg-indigo-500/20 px-4 py-2 text-sm font-semibold text-indigo-100 transition hover:bg-indigo-500/30"
                >
                  Sang DDI
                </Link>
              </div>
            </div>

            <div className="mt-4 rounded-[1.4rem] border border-dashed border-cyan-300/55 bg-cyan-500/10 p-6 sm:p-8">
              <label className="block text-sm font-semibold text-cyan-100" htmlFor="scan-file-input">
                Chọn file ảnh/PDF đơn thuốc
              </label>
              <input
                id="scan-file-input"
                type="file"
                accept="image/*,.pdf"
                onChange={(event) => setScanFile(event.target.files?.[0] ?? null)}
                className="mt-3 block w-full rounded-xl border border-cyan-300/50 bg-[#07182f] px-3 py-3 text-sm text-slate-100 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500/35 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-cyan-50"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void onScanFile()}
                  disabled={isScanningFile}
                  className="inline-flex min-h-12 items-center rounded-xl border border-cyan-300/55 bg-cyan-500/20 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/30 disabled:opacity-60"
                >
                  {isScanningFile ? "Đang quét file..." : "Quét file OCR"}
                </button>
              </div>
            </div>
          </section>

          <section className="chrome-panel rounded-[1.35rem] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Bước 2</p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Ghi hoặc dán nội dung OCR</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Nếu OCR ngoài đã có text, dán vào đây để nhận diện nhanh.</p>

            <textarea
              value={scanText}
              onChange={(event) => setScanText(event.target.value)}
              placeholder="Dán nội dung OCR đơn thuốc/hóa đơn..."
              className="mt-3 min-h-[180px] w-full rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-4 py-3 text-base leading-7 text-[var(--text-primary)]"
            />

            <button
              type="button"
              onClick={() => void onScanText()}
              disabled={isScanningText}
              className="mt-3 inline-flex min-h-12 items-center rounded-xl border border-sky-300/55 bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/30 disabled:opacity-60"
            >
              {isScanningText ? "Đang quét nội dung..." : "Quét nội dung OCR"}
            </button>

            {scanNotice ? <p className="mt-3 text-sm text-[var(--text-secondary)]">{scanNotice}</p> : null}

            {detections.length ? (
              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Danh sách thuốc nhận diện</p>
                  <span className="rounded-full border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 py-1 text-xs text-[var(--text-secondary)]">
                    Đã chọn {selectedDetections.length}/{detections.length}
                  </span>
                </div>

                <ul className="grid gap-2 lg:grid-cols-2">
                  {detections.map((item, index) => {
                    const key = `${item.normalized_name}-${index}`;
                    const checked = Boolean(selectedKeys[key]);
                    return (
                      <li
                        key={key}
                        className={`rounded-2xl border p-3 transition ${
                          checked
                            ? "border-cyan-300/55 bg-cyan-500/10"
                            : "border-[color:var(--shell-border)] bg-[var(--surface-muted)]"
                        }`}
                      >
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => onToggleDetection(key)}
                            className="mt-1 h-4 w-4 rounded"
                          />
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">{item.drug_name}</p>
                            <p className="mt-1 text-xs text-[var(--text-secondary)]">Bằng chứng: {item.evidence}</p>
                            <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${confidenceClass(item.confidence)}`}>
                              OCR {Math.round(item.confidence * 100)}%
                            </span>
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>

                <button
                  type="button"
                  onClick={() => void onImportSelected()}
                  disabled={isImporting || selectedDetections.length === 0}
                  className="inline-flex min-h-12 items-center rounded-xl border border-emerald-300/55 bg-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30 disabled:opacity-60"
                >
                  {isImporting ? "Đang thêm vào tủ..." : `Thêm ${selectedDetections.length} thuốc vào tủ`}
                </button>
              </div>
            ) : null}
          </section>

          <section className="chrome-panel rounded-[1.35rem] p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">Bước 3</p>
            <h3 className="mt-2 text-xl font-semibold text-[var(--text-primary)]">Thêm thủ công</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">Dùng khi đơn thuốc khó OCR hoặc muốn nhập nhanh từng thuốc.</p>

            <form onSubmit={onAddManual} className="mt-4 grid gap-3 md:grid-cols-3">
              <label className="space-y-1 md:col-span-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Tên thuốc</span>
                <input
                  value={manualDrugName}
                  onChange={(event) => setManualDrugName(event.target.value)}
                  required
                  placeholder="Ví dụ: Metformin"
                  className="h-12 w-full rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 text-sm text-[var(--text-primary)]"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Liều dùng</span>
                <input
                  value={manualDosage}
                  onChange={(event) => setManualDosage(event.target.value)}
                  placeholder="Ví dụ: 500mg"
                  className="h-12 w-full rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 text-sm text-[var(--text-primary)]"
                />
              </label>

              <label className="space-y-1">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-muted)]">Số lượng</span>
                <input
                  value={manualQuantity}
                  onChange={(event) => setManualQuantity(event.target.value)}
                  placeholder="1"
                  className="h-12 w-full rounded-xl border border-[color:var(--shell-border)] bg-[var(--surface-muted)] px-3 text-sm text-[var(--text-primary)]"
                />
              </label>

              <div className="md:col-span-3">
                <button
                  type="submit"
                  disabled={isAddingManual}
                  className="inline-flex min-h-12 items-center rounded-xl border border-sky-300/55 bg-sky-500/20 px-4 py-2 text-sm font-semibold text-sky-100 transition hover:bg-sky-500/30 disabled:opacity-60"
                >
                  {isAddingManual ? "Đang thêm..." : "Thêm thủ công vào tủ"}
                </button>
              </div>
            </form>

            {manualNotice ? <p className="mt-3 text-sm text-[var(--text-secondary)]">{manualNotice}</p> : null}
          </section>
        </div>
      </SelfMedConsentGate>
    </PageShell>
  );
}
