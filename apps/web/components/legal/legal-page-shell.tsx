import Link from "next/link";
import { ReactNode } from "react";

type LegalPageShellProps = {
  title: string;
  summary: string;
  updatedAt: string;
  children: ReactNode;
};

export default function LegalPageShell({ title, summary, updatedAt, children }: LegalPageShellProps) {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Project CLARA - Legal</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">{title}</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">{summary}</p>
        <p className="mt-2 text-xs text-slate-500">
          Cập nhật lần cuối: <span className="font-semibold">{updatedAt}</span>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/legal" className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
            Trung tâm pháp lý
          </Link>
          <Link href="/" className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100">
            Về trang chủ
          </Link>
        </div>
      </section>

      <section className="space-y-4">{children}</section>
    </main>
  );
}

