export default function PageShell({
  title,
  children
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <section>
      <h1 className="mb-4 text-2xl font-bold">{title}</h1>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">{children}</div>
    </section>
  );
}
