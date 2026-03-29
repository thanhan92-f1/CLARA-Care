export default function PageShell({
  title,
  description,
  children,
  variant = "card"
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
  variant?: "card" | "plain";
}) {
  const heading = (
    <div className="space-y-1.5">
      <h1 className="text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-[2rem]">{title}</h1>
      {description ? <p className="text-sm text-[var(--text-secondary)] sm:text-[15px]">{description}</p> : null}
    </div>
  );

  if (variant === "plain") {
    return (
      <section className="space-y-4">
        {heading}
        <div>{children}</div>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {heading}
      <div className="rounded-2xl border border-[color:var(--shell-border)] bg-[var(--surface-panel)] p-4 shadow-[var(--shadow-soft)] backdrop-blur sm:p-5">
        {children}
      </div>
    </section>
  );
}
