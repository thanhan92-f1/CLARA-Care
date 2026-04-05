import Image from "next/image";
import Link from "next/link";

import LandingFaqAccordion from "@/components/landing/landing-faq-accordion";
import {
  FAQ_ITEMS,
  FINAL_CTA,
  HERO_METRICS,
  INTEGRATIONS,
  MODULE_CARDS,
  OFFICES,
  PROBLEM_POINTS,
  ROI_METRICS,
  SAFETY_GUARDRAILS,
  SPONSORS,
  TESTIMONIALS,
  WORKFLOW_STEPS,
} from "@/components/landing/clara-kp3-data";

function SectionContainer({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={`mx-auto w-full max-w-[1320px] px-4 min-[1024px]:px-8 min-[1440px]:px-10 ${className}`}
    >
      {children}
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200/95">{children}</p>
  );
}

function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-cyan-300/70 bg-cyan-400 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.06em] text-slate-900 transition hover:-translate-y-0.5 hover:bg-cyan-300"
    >
      {children}
    </Link>
  );
}

function SecondaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-blue-200/40 bg-[#0a1b3d] px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.06em] text-blue-100 transition hover:border-cyan-300/55 hover:text-cyan-100"
    >
      {children}
    </Link>
  );
}

export default function ClaraKp3Landing() {
  const hanoiOffices = OFFICES.filter((office) => office.city === "HÀ NỘI (VN)");
  const hueOffice = OFFICES.find((office) => office.city === "HUẾ (VN)");
  const emailOffice = OFFICES.find((office) => office.city === "EMAIL");
  const hotlineOffice = OFFICES.find((office) => office.city === "HOTLINE");

  return (
    <main className="relative overflow-hidden bg-[#030817] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_0%,rgba(34,211,238,0.18),transparent_40%),radial-gradient(circle_at_92%_12%,rgba(59,130,246,0.16),transparent_36%)]" />

      <SectionContainer className="relative z-20 pt-6">
        <header className="sticky top-3 z-30 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-300/25 bg-[#07152f]/88 px-4 py-3 backdrop-blur-xl min-[1024px]:px-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-200">Project CLARA</p>
            <p className="text-sm text-slate-300">Clinical Agent for Retrieval &amp; Analysis</p>
          </div>

          <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold min-[1024px]:gap-3">
            <a href="#modules" className="rounded-lg border border-blue-300/25 px-3 py-2 text-blue-100 transition hover:bg-blue-500/10">
              Modules
            </a>
            <a href="#roi" className="rounded-lg border border-blue-300/25 px-3 py-2 text-blue-100 transition hover:bg-blue-500/10">
              ROI
            </a>
            <a href="#safety" className="rounded-lg border border-blue-300/25 px-3 py-2 text-blue-100 transition hover:bg-blue-500/10">
              Safety
            </a>
            <a href="#faq" className="rounded-lg border border-blue-300/25 px-3 py-2 text-blue-100 transition hover:bg-blue-500/10">
              FAQ
            </a>
            <PrimaryButton href="/register">Đặt lịch demo</PrimaryButton>
          </nav>
        </header>
      </SectionContainer>

      <SectionContainer className="relative z-10 pt-8 pb-8 min-[1024px]:pt-12 min-[1024px]:pb-12">
        <section className="rounded-[1.75rem] border border-blue-200/20 bg-[#081731]/90 p-5 min-[1024px]:p-9">
          <SectionLabel>Homepage Overview</SectionLabel>
          <div className="mt-4 grid gap-8 min-[1024px]:grid-cols-[1.25fr_0.95fr]">
            <div>
              <h1 className="text-4xl font-black uppercase leading-[1.02] text-white min-[640px]:text-5xl min-[1200px]:text-6xl">
                Nền tảng AI y tế
                <br />
                <span className="text-cyan-200">vận hành theo KPI thật</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 min-[1024px]:text-lg">
                Project CLARA giúp đội lâm sàng và đội vận hành triển khai workflow Research, Council, Self-Med,
                CareGuard và Scribe trong cùng một hệ thống có kiểm chứng, có cảnh báo và có đo lường theo tuần.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <PrimaryButton href="/register">Bắt đầu pilot</PrimaryButton>
                <SecondaryButton href="/research">Xem demo flow</SecondaryButton>
              </div>
              <p className="mt-3 text-sm text-blue-100/85">
                Tập trung use-case đầu tiên trong 7-14 ngày, sau đó mở rộng theo dữ liệu thực tế.
              </p>
            </div>

            <aside className="rounded-2xl border border-blue-200/20 bg-[#0a1c3f] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Proof Snapshot</p>
              <ul className="mt-4 space-y-3">
                {HERO_METRICS.map((metric) => {
                  const note = "note" in metric ? metric.note : undefined;
                  return (
                    <li key={metric.label} className="rounded-xl border border-blue-200/20 bg-blue-500/10 px-4 py-3">
                      <p className="text-2xl font-black text-white">{metric.value}</p>
                      <p className="mt-1 text-sm text-blue-100">{metric.label}</p>
                      {note ? <p className="mt-1 text-xs text-slate-300">{note}</p> : null}
                    </li>
                  );
                })}
              </ul>
            </aside>
          </div>
        </section>
      </SectionContainer>

      <SectionContainer className="relative z-10 pb-10">
        <section className="rounded-2xl border border-blue-200/20 bg-[#081731]/72 p-5 min-[1024px]:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionLabel>Sponsors & Integration Base</SectionLabel>
            <p className="text-sm text-slate-300">Hạ tầng và nguồn tri thức hỗ trợ triển khai</p>
          </div>

          <div className="mt-5 grid gap-3 min-[900px]:grid-cols-2">
            {SPONSORS.map((sponsor) => (
              <a
                key={sponsor.name}
                href={sponsor.href}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[128px] items-center justify-between rounded-2xl border border-blue-200/20 bg-white px-5 py-4 text-slate-900 transition hover:-translate-y-0.5"
              >
                <Image src={sponsor.logo} alt={`${sponsor.name} logo`} width={220} height={62} className="h-12 w-auto object-contain" />
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-700">{sponsor.name}</span>
              </a>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {INTEGRATIONS.map((integration) => (
              <span
                key={integration.name}
                className="rounded-full border border-blue-300/25 bg-blue-500/10 px-3 py-1.5 text-xs font-medium text-blue-100"
                title={integration.description}
              >
                {integration.name}
              </span>
            ))}
          </div>
        </section>
      </SectionContainer>

      <SectionContainer className="relative z-10 pb-10">
        <section className="rounded-2xl border border-rose-200/20 bg-[#0a142f]/90 p-5 min-[1024px]:p-7">
          <SectionLabel>Vấn Đề Cần Giải Quyết</SectionLabel>
          <h2 className="mt-3 text-3xl font-black uppercase text-white min-[1024px]:text-4xl">
            Triển khai AI y tế thất bại khi thiếu workflow và đo lường
          </h2>
          <div className="mt-6 grid gap-4 min-[900px]:grid-cols-2">
            {PROBLEM_POINTS.map((problem) => (
              <article key={problem.title} className="rounded-2xl border border-blue-200/20 bg-[#081a3b] p-5">
                <h3 className="text-xl font-bold text-white">{problem.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-200">{problem.description}</p>
                <p className="mt-3 text-sm font-semibold text-cyan-200">{problem.consequence}</p>
              </article>
            ))}
          </div>
        </section>
      </SectionContainer>

      <SectionContainer className="relative z-10 pb-10">
        <section className="rounded-2xl border border-blue-200/20 bg-[#07152f]/92 p-5 min-[1024px]:p-7">
          <SectionLabel>How Project CLARA Works</SectionLabel>
          <h2 className="mt-3 text-3xl font-black uppercase text-white min-[1024px]:text-4xl">
            Luồng triển khai 4 bước theo mô hình pilot có kiểm soát
          </h2>
          <div className="mt-6 grid gap-4 min-[900px]:grid-cols-2">
            {WORKFLOW_STEPS.map((step) => (
              <article key={step.index} className="rounded-2xl border border-blue-300/20 bg-[#0b1e44] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-200">Step {step.index}</p>
                <h3 className="mt-2 text-2xl font-black text-white">{step.title}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-200">{step.subtitle}</p>
                <ul className="mt-4 space-y-2 text-sm leading-7 text-slate-200">
                  {step.points.map((point) => (
                    <li key={point} className="rounded-lg border border-blue-200/20 bg-blue-500/10 px-3 py-2">
                      {point}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm font-semibold text-cyan-100">Kết quả: {step.outcome}</p>
              </article>
            ))}
          </div>
        </section>
      </SectionContainer>

      <SectionContainer id="modules" className="relative z-10 pb-10">
        <section className="rounded-2xl border border-blue-200/20 bg-[#061126]/92 p-5 min-[1024px]:p-7">
          <SectionLabel>Modules</SectionLabel>
          <h2 className="mt-3 text-3xl font-black uppercase text-white min-[1024px]:text-4xl">
            6 module cốt lõi cho nghiên cứu, hội chẩn, an toàn thuốc và vận hành
          </h2>
          <div className="mt-6 grid gap-4 min-[900px]:grid-cols-2 min-[1280px]:grid-cols-3">
            {MODULE_CARDS.map((module) => (
              <article key={module.title} className="flex h-full flex-col rounded-2xl border border-blue-200/20 bg-[#081a3b] p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200">{module.tag}</p>
                <h3 className="mt-2 text-2xl font-black text-white">{module.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-200">{module.description}</p>
                <ul className="mt-4 flex-1 space-y-2 text-sm text-blue-100">
                  {module.bullets.map((bullet) => (
                    <li key={bullet} className="rounded-lg border border-blue-200/20 bg-blue-500/10 px-3 py-2">
                      {bullet}
                    </li>
                  ))}
                </ul>
                <div className="mt-5">
                  <SecondaryButton href={module.href}>{module.cta}</SecondaryButton>
                </div>
              </article>
            ))}
          </div>
        </section>
      </SectionContainer>

      <SectionContainer id="roi" className="relative z-10 pb-10">
        <section className="rounded-2xl border border-emerald-200/20 bg-[#061c1f]/90 p-5 min-[1024px]:p-7">
          <SectionLabel>ROI & Measurement</SectionLabel>
          <h2 className="mt-3 text-3xl font-black uppercase text-white min-[1024px]:text-4xl">
            Chỉ số pilot tập trung vào hiệu quả vận hành và độ an toàn quy trình
          </h2>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-200">
            Các mục tiêu dưới đây là khung đo thường dùng trong giai đoạn pilot. Kết quả thực tế phụ thuộc baseline,
            chất lượng dữ liệu và mức tuân thủ workflow của từng đơn vị.
          </p>
          <div className="mt-6 grid gap-4 min-[900px]:grid-cols-2">
            {ROI_METRICS.map((metric) => (
              <article key={metric.label} className="rounded-2xl border border-emerald-200/25 bg-emerald-500/10 p-5">
                <p className="text-sm font-semibold text-emerald-100">{metric.label}</p>
                <p className="mt-2 text-2xl font-black text-white">{metric.target}</p>
                <p className="mt-2 text-xs leading-6 text-slate-200">{metric.note}</p>
              </article>
            ))}
          </div>
        </section>
      </SectionContainer>

      <SectionContainer id="safety" className="relative z-10 pb-10">
        <section className="rounded-2xl border border-cyan-200/20 bg-[#051325]/92 p-5 min-[1024px]:p-7">
          <SectionLabel>Clinical Safety & Governance</SectionLabel>
          <h2 className="mt-3 text-3xl font-black uppercase text-white min-[1024px]:text-4xl">
            Safety-first: có guardrail, có giới hạn, có lưu vết
          </h2>
          <div className="mt-6 grid gap-4 min-[900px]:grid-cols-2 min-[1280px]:grid-cols-3">
            {SAFETY_GUARDRAILS.map((item) => (
              <article key={item.title} className="rounded-2xl border border-cyan-200/25 bg-cyan-500/10 p-4">
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-200">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm leading-7 text-amber-100">
            <p className="font-semibold uppercase tracking-[0.12em]">Giới hạn hệ thống</p>
            <p className="mt-2">
              Project CLARA là hệ thống hỗ trợ tham khảo và vận hành theo bằng chứng, không thay thế phán đoán lâm sàng
              hoặc chỉ định điều trị của bác sĩ.
            </p>
          </div>
        </section>
      </SectionContainer>

      <SectionContainer className="relative z-10 pb-10">
        <section className="rounded-2xl border border-blue-200/20 bg-[#07152f]/90 p-5 min-[1024px]:p-7">
          <SectionLabel>Testimonials</SectionLabel>
          <h2 className="mt-3 text-3xl font-black uppercase text-white min-[1024px]:text-4xl">
            Đối tác và người dùng nói gì về CLARA
          </h2>
          <div className="mt-6 grid gap-4 min-[900px]:grid-cols-2 min-[1280px]:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <article key={testimonial.name} className="rounded-2xl border border-blue-200/20 bg-[#0a1d42] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-white">{testimonial.name}</p>
                    <p className="text-sm text-blue-200">{testimonial.role}</p>
                  </div>
                  <span className="rounded-full border border-blue-300/30 bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-100">
                    {testimonial.channel}
                  </span>
                </div>
                <p className="mt-4 text-base leading-8 text-slate-200">&quot;{testimonial.quote}&quot;</p>
              </article>
            ))}
          </div>
        </section>
      </SectionContainer>

      <SectionContainer id="faq" className="relative z-10 pb-10">
        <section className="rounded-2xl border border-blue-200/20 bg-[#061231] p-5 min-[1024px]:p-7">
          <SectionLabel>FAQ</SectionLabel>
          <h2 className="mt-3 text-3xl font-black uppercase text-white min-[1024px]:text-4xl">Giải đáp trước khi triển khai pilot</h2>
          <div className="mt-6">
            <LandingFaqAccordion items={FAQ_ITEMS} />
          </div>
        </section>
      </SectionContainer>

      <SectionContainer className="relative z-10 pb-10">
        <section className="rounded-2xl border border-blue-200/20 bg-[#07152f]/90 p-5 min-[1024px]:p-7">
          <SectionLabel>Our Offices</SectionLabel>
          <h2 className="mt-3 text-3xl font-black uppercase text-white min-[1024px]:text-4xl">Kênh vận hành và liên hệ</h2>
          <div className="mt-6 grid gap-4 min-[1024px]:grid-cols-[1.3fr_1fr]">
            <article className="rounded-2xl border border-blue-200/20 bg-[#0a1d42] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">HÀ NỘI (VN)</p>
              <h3 className="mt-2 text-2xl font-black text-white">Delivery Hubs</h3>
              <ul className="mt-4 space-y-3">
                {hanoiOffices.map((office) => (
                  <li key={office.detail} className="rounded-lg border border-blue-200/20 bg-blue-500/10 px-3 py-2 text-sm leading-7 text-slate-200">
                    {office.detail}
                  </li>
                ))}
              </ul>
            </article>

            <div className="grid gap-4">
              {hueOffice ? (
                <article className="rounded-2xl border border-blue-200/20 bg-[#0a1d42] p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">{hueOffice.city}</p>
                  <p className="mt-3 text-sm leading-7 text-slate-200">{hueOffice.detail}</p>
                </article>
              ) : null}

              <article className="rounded-2xl border border-blue-200/20 bg-[#0a1d42] p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-200">Liên hệ nhanh</p>
                {emailOffice ? <p className="mt-3 text-sm text-slate-200">Email: {emailOffice.detail}</p> : null}
                {hotlineOffice ? <p className="mt-2 text-sm text-slate-200">Hotline: {hotlineOffice.detail}</p> : null}
              </article>
            </div>
          </div>
        </section>
      </SectionContainer>

      <SectionContainer className="relative z-10 pb-14">
        <section className="rounded-2xl border border-cyan-300/30 bg-[#07142e] p-6 min-[1024px]:p-10">
          <h2 className="text-center text-3xl font-black uppercase text-white min-[1024px]:text-4xl">{FINAL_CTA.heading}</h2>
          <p className="mx-auto mt-4 max-w-4xl text-center text-sm leading-7 text-slate-200 min-[1024px]:text-base">
            {FINAL_CTA.subheading}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <PrimaryButton href={FINAL_CTA.href}>{FINAL_CTA.button}</PrimaryButton>
            {FINAL_CTA.secondaryButton && FINAL_CTA.secondaryHref ? (
              <SecondaryButton href={FINAL_CTA.secondaryHref}>{FINAL_CTA.secondaryButton}</SecondaryButton>
            ) : null}
          </div>

          <footer className="mt-8 border-t border-blue-300/20 pt-6 text-center text-sm text-slate-300">
            <p className="text-2xl font-black text-white">Project CLARA</p>
            <p className="mt-2">Email: clara@thiennn.icu · Hotline: 0853374247</p>
          </footer>
        </section>
      </SectionContainer>
    </main>
  );
}
