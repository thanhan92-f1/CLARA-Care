import Image from "next/image";
import Link from "next/link";

import LandingFaqAccordion from "@/components/landing/landing-faq-accordion";
import {
  FAQ_ITEMS,
  FINAL_CTA,
  HERO_METRICS,
  MODULE_CARDS,
  OFFICES,
  OUTCOME_CARDS,
  PROBLEM_POINTS,
  ROI_METRICS,
  SAFETY_GUARDRAILS,
  SPONSORS,
  TESTIMONIALS,
  TRUST_BADGES,
  WORKFLOW_STEPS,
} from "@/components/landing/clara-kp3-data";

function Container({
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
      className={`mx-auto w-full max-w-[1240px] px-4 min-[768px]:px-6 min-[1280px]:px-8 ${className}`}
    >
      {children}
    </section>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-200">
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-3 text-3xl font-black uppercase leading-tight text-slate-900 min-[1024px]:text-4xl dark:text-white">
      {children}
    </h2>
  );
}

function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-cyan-500 px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.06em] text-white transition hover:-translate-y-0.5 hover:bg-cyan-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
    >
      {children}
    </Link>
  );
}

function SecondaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.06em] text-slate-700 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:text-cyan-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-cyan-500 dark:hover:text-cyan-200"
    >
      {children}
    </Link>
  );
}

function AnchorLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
    >
      {children}
    </a>
  );
}

export default function ClaraKp3Landing() {
  const hanoiOffices = OFFICES.filter((office) => office.city === "HÀ NỘI (VN)");
  const hueOffice = OFFICES.find((office) => office.city === "HUẾ (VN)");
  const emailOffice = OFFICES.find((office) => office.city === "EMAIL");
  const hotlineOffice = OFFICES.find((office) => office.city === "HOTLINE");

  return (
    <main className="relative overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(34,211,238,0.16),transparent_36%),radial-gradient(circle_at_94%_8%,rgba(56,189,248,0.1),transparent_34%)] dark:bg-[radial-gradient(circle_at_8%_0%,rgba(34,211,238,0.24),transparent_38%),radial-gradient(circle_at_92%_10%,rgba(59,130,246,0.2),transparent_36%)]"
      />

      <Container className="relative z-20 pt-5">
        <header className="sticky top-3 z-40 rounded-2xl border border-slate-200/90 bg-white/90 p-3 shadow-sm backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-900/80">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">
                Project CLARA
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Clinical Agent for Retrieval &amp; Analysis
              </p>
            </div>

            <nav className="flex flex-wrap items-center gap-1">
              <AnchorLink href="#modules">Modules</AnchorLink>
              <AnchorLink href="#workflow">Workflow</AnchorLink>
              <AnchorLink href="#safety">Safety</AnchorLink>
              <AnchorLink href="#faq">FAQ</AnchorLink>
              <PrimaryButton href="/register">Đặt lịch demo</PrimaryButton>
            </nav>
          </div>
        </header>
      </Container>

      <Container className="relative z-10 pt-8 pb-8 min-[1024px]:pt-12">
        <section className="overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-[0_20px_65px_-48px_rgba(2,6,23,0.55)] min-[1024px]:p-8 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="grid gap-8 min-[1024px]:grid-cols-[1.2fr_0.92fr] min-[1280px]:gap-10">
            <div>
              <SectionEyebrow>Healthcare AI Homepage</SectionEyebrow>
              <h1 className="mt-3 text-4xl font-black uppercase leading-[1.04] text-slate-950 min-[640px]:text-5xl min-[1200px]:text-6xl dark:text-white">
                Một nền tảng
                <br />
                <span className="text-cyan-700 dark:text-cyan-200">để vận hành AI y tế thật</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700 min-[1024px]:text-lg dark:text-slate-300">
                Project CLARA kết nối Research, Council, SelfMed, CareGuard, Scribe và Control Tower thành một workflow
                có bằng chứng, có guardrail và có KPI đo theo tuần.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <PrimaryButton href="/register">Bắt đầu pilot</PrimaryButton>
                <SecondaryButton href="/research">Xem demo Research</SecondaryButton>
              </div>

              <div className="mt-6 grid gap-3 min-[768px]:grid-cols-3">
                {TRUST_BADGES.map((badge) => (
                  <article
                    key={badge.label}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">
                      {badge.label}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{badge.detail}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-4 min-[1024px]:p-5 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-200">
                Pilot Signal Board
              </p>
              <ul className="mt-4 space-y-3">
                {HERO_METRICS.map((metric) => (
                  <li
                    key={metric.label}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-950/80"
                  >
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{metric.value}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{metric.label}</p>
                    {metric.note ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{metric.note}</p> : null}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </section>
      </Container>

      <Container className="relative z-10 pb-10">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 min-[1024px]:p-7 dark:border-slate-800 dark:bg-slate-900/75">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionEyebrow>Backed by Partners</SectionEyebrow>
            <p className="text-sm text-slate-500 dark:text-slate-400">Đối tác hạ tầng triển khai của Project CLARA</p>
          </div>

          <div className="mt-6 grid gap-4 min-[900px]:grid-cols-2">
            {SPONSORS.map((sponsor) => (
              <a
                key={sponsor.name}
                href={sponsor.href}
                target="_blank"
                rel="noreferrer"
                className="group flex min-h-[144px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-6 transition hover:-translate-y-0.5 hover:border-cyan-300 dark:border-slate-700 dark:bg-slate-900"
              >
                <Image
                  src={sponsor.logo}
                  alt={`${sponsor.name} logo`}
                  width={sponsor.name === "BNIX" ? 280 : 420}
                  height={sponsor.name === "BNIX" ? 84 : 110}
                  className={[
                    "w-auto object-contain transition duration-300 group-hover:scale-[1.02]",
                    sponsor.name === "BNIX" ? "h-14 min-[1024px]:h-16" : "h-16 min-[1024px]:h-20",
                  ].join(" ")}
                />
              </a>
            ))}
          </div>
        </section>
      </Container>

      <Container className="relative z-10 pb-10">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 min-[1024px]:p-7 dark:border-slate-800 dark:bg-slate-900/75">
          <SectionEyebrow>Pain Points</SectionEyebrow>
          <SectionTitle>Vì sao nhiều hệ thống AI y tế chưa đi vào vận hành?</SectionTitle>

          <div className="mt-6 grid gap-4 min-[900px]:grid-cols-2">
            {PROBLEM_POINTS.map((problem) => (
              <article
                key={problem.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900"
              >
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{problem.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">{problem.description}</p>
                <p className="mt-3 text-sm font-semibold text-cyan-700 dark:text-cyan-200">{problem.consequence}</p>
              </article>
            ))}
          </div>
        </section>
      </Container>

      <Container className="relative z-10 pb-10">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 min-[1024px]:p-7 dark:border-slate-800 dark:bg-slate-900/75">
          <SectionEyebrow>Outcome Design</SectionEyebrow>
          <SectionTitle>Landing tập trung vào giá trị có thể đo</SectionTitle>

          <div className="mt-6 grid gap-4 min-[1024px]:grid-cols-3">
            {OUTCOME_CARDS.map((outcome) => (
              <article
                key={outcome.title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900"
              >
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">{outcome.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">{outcome.description}</p>
                <ul className="mt-4 space-y-2">
                  {outcome.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                    >
                      {bullet}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </Container>

      <Container id="workflow" className="relative z-10 pb-10">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 min-[1024px]:p-7 dark:border-slate-800 dark:bg-slate-900/75">
          <SectionEyebrow>How Project CLARA Works</SectionEyebrow>
          <SectionTitle>Luồng 4 bước để chuyển từ demo sang vận hành thật</SectionTitle>

          <div className="mt-6 grid gap-4 min-[1024px]:grid-cols-2">
            {WORKFLOW_STEPS.map((step) => (
              <article
                key={step.index}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-200">Step {step.index}</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{step.title}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                  {step.subtitle}
                </p>
                <ul className="mt-4 space-y-2">
                  {step.points.map((point) => (
                    <li
                      key={point}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-7 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                    >
                      {point}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm font-semibold text-cyan-700 dark:text-cyan-200">Kết quả: {step.outcome}</p>
              </article>
            ))}
          </div>
        </section>
      </Container>

      <Container id="modules" className="relative z-10 pb-10">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 min-[1024px]:p-7 dark:border-slate-800 dark:bg-slate-900/75">
          <SectionEyebrow>Modules</SectionEyebrow>
          <SectionTitle>Hệ module đầy đủ cho nghiên cứu, hội chẩn và an toàn thuốc</SectionTitle>

          <div className="mt-6 grid gap-4 min-[900px]:grid-cols-2 min-[1280px]:grid-cols-3">
            {MODULE_CARDS.map((module) => (
              <article
                key={module.title}
                className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">{module.tag}</p>
                <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{module.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">{module.description}</p>
                <ul className="mt-4 flex-1 space-y-2">
                  {module.bullets.map((bullet) => (
                    <li
                      key={bullet}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                    >
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
      </Container>

      <Container id="roi" className="relative z-10 pb-10">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 min-[1024px]:p-7 dark:border-slate-800 dark:bg-slate-900/75">
          <SectionEyebrow>ROI & Measurement</SectionEyebrow>
          <SectionTitle>Đo hiệu quả theo baseline, không đo theo cảm nhận</SectionTitle>
          <p className="mt-4 max-w-4xl text-sm leading-7 text-slate-700 dark:text-slate-300">
            Các chỉ số dưới đây là khung pilot thường dùng để theo dõi tác động vận hành. Kết quả thực tế phụ thuộc
            dữ liệu đầu vào, tỷ lệ tuân thủ workflow và mức trưởng thành của đội vận hành.
          </p>

          <div className="mt-6 grid gap-4 min-[900px]:grid-cols-2">
            {ROI_METRICS.map((metric) => (
              <article
                key={metric.label}
                className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800/60 dark:bg-emerald-950/30"
              >
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{metric.label}</p>
                <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{metric.target}</p>
                <p className="mt-2 text-xs leading-6 text-slate-600 dark:text-slate-300">{metric.note}</p>
              </article>
            ))}
          </div>
        </section>
      </Container>

      <Container id="safety" className="relative z-10 pb-10">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 min-[1024px]:p-7 dark:border-slate-800 dark:bg-slate-900/75">
          <SectionEyebrow>Clinical Safety & Governance</SectionEyebrow>
          <SectionTitle>Safety-first: có guardrail, có giới hạn, có kiểm toán</SectionTitle>

          <div className="mt-6 grid gap-4 min-[900px]:grid-cols-2 min-[1280px]:grid-cols-3">
            {SAFETY_GUARDRAILS.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 dark:border-cyan-900/70 dark:bg-cyan-950/25"
              >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-slate-700 dark:text-slate-300">{item.description}</p>
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm leading-7 text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <p className="font-semibold uppercase tracking-[0.12em]">Giới hạn hệ thống</p>
            <p className="mt-2">
              Project CLARA là hệ thống hỗ trợ tham khảo và vận hành dựa trên bằng chứng, không thay thế chẩn đoán,
              chỉ định điều trị hoặc phán đoán chuyên môn của bác sĩ.
            </p>
          </div>
        </section>
      </Container>

      <Container className="relative z-10 pb-10">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 min-[1024px]:p-7 dark:border-slate-800 dark:bg-slate-900/75">
          <SectionEyebrow>Testimonials</SectionEyebrow>
          <SectionTitle>Đối tác và người dùng nói gì về CLARA</SectionTitle>

          <div className="mt-6 grid gap-4 min-[900px]:grid-cols-2 min-[1280px]:grid-cols-3">
            {TESTIMONIALS.map((testimonial) => (
              <article
                key={testimonial.name}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">{testimonial.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{testimonial.role}</p>
                  </div>
                  <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-300">
                    {testimonial.channel}
                  </span>
                </div>
                <p className="mt-4 text-lg leading-8 text-slate-700 dark:text-slate-200">&quot;{testimonial.quote}&quot;</p>
              </article>
            ))}
          </div>
        </section>
      </Container>

      <Container id="faq" className="relative z-10 pb-10">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 min-[1024px]:p-7 dark:border-slate-800 dark:bg-slate-900/75">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <SectionTitle>Giải đáp trước khi triển khai pilot</SectionTitle>
          <div className="mt-6">
            <LandingFaqAccordion items={FAQ_ITEMS} />
          </div>
        </section>
      </Container>

      <Container className="relative z-10 pb-10">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 min-[1024px]:p-7 dark:border-slate-800 dark:bg-slate-900/75">
          <SectionEyebrow>Our Offices</SectionEyebrow>
          <SectionTitle>Kênh vận hành và liên hệ</SectionTitle>

          <div className="mt-6 grid gap-4 min-[1024px]:grid-cols-[1.3fr_1fr]">
            <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-200">HÀ NỘI (VN)</p>
              <h3 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">Delivery Hubs</h3>
              <ul className="mt-4 space-y-3">
                {hanoiOffices.map((office) => (
                  <li
                    key={office.detail}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm leading-7 text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                  >
                    {office.detail}
                  </li>
                ))}
              </ul>
            </article>

            <div className="grid gap-4">
              {hueOffice ? (
                <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-200">
                    {hueOffice.city}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">{hueOffice.detail}</p>
                </article>
              ) : null}

              <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700 dark:text-cyan-200">Liên hệ nhanh</p>
                {emailOffice ? <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">Email: {emailOffice.detail}</p> : null}
                {hotlineOffice ? <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">Hotline: {hotlineOffice.detail}</p> : null}
              </article>
            </div>
          </div>
        </section>
      </Container>

      <Container className="relative z-10 pb-14">
        <section className="rounded-2xl border border-cyan-300/60 bg-cyan-500/10 p-6 min-[1024px]:p-10 dark:border-cyan-700/70 dark:bg-cyan-950/35">
          <h2 className="text-center text-3xl font-black uppercase text-slate-900 min-[1024px]:text-4xl dark:text-white">
            {FINAL_CTA.heading}
          </h2>
          <p className="mx-auto mt-4 max-w-4xl text-center text-sm leading-7 text-slate-700 min-[1024px]:text-base dark:text-slate-300">
            {FINAL_CTA.subheading}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <PrimaryButton href={FINAL_CTA.href}>{FINAL_CTA.button}</PrimaryButton>
            {FINAL_CTA.secondaryButton && FINAL_CTA.secondaryHref ? (
              <SecondaryButton href={FINAL_CTA.secondaryHref}>{FINAL_CTA.secondaryButton}</SecondaryButton>
            ) : null}
          </div>

          <footer className="mt-8 border-t border-cyan-300/50 pt-6 text-center text-sm text-slate-600 dark:border-cyan-800/60 dark:text-slate-300">
            <p className="text-2xl font-black text-slate-900 dark:text-white">Project CLARA</p>
            <p className="mt-2">Email: clara@thiennn.icu · Hotline: 0853374247</p>
          </footer>
        </section>
      </Container>
    </main>
  );
}
