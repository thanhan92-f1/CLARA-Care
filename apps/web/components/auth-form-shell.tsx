import { ReactNode } from "react";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export default function AuthFormShell({ title, subtitle, children }: Props) {
  return (
    <main className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center overflow-hidden px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute -left-12 top-12 h-64 w-64 rounded-full bg-sky-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-12 bottom-12 h-64 w-64 rounded-full bg-teal-300/20 blur-3xl" />

      <section className="glass-surface-2 w-full max-w-lg rounded-3xl border p-6 sm:p-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-700">CLARA Care</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[2rem]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}
