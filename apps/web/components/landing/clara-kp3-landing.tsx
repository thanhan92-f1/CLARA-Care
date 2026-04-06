import Image from "next/image";
import Link from "next/link";

import {
  FAQ_ITEMS,
  FINAL_CTA,
  HERO_METRICS,
  MODULE_CARDS,
  OFFICES,
  SPONSORS,
  TESTIMONIALS,
  TRUST_BADGES,
  WORKFLOW_STEPS,
} from "@/components/landing/clara-kp3-data";

function clampText(input: string, length: number) {
  if (input.length <= length) return input;
  return `${input.slice(0, length).trim()}...`;
}

export default function ClaraKp3Landing() {
  const shortFaq = FAQ_ITEMS.slice(0, 3);
  const shortTestimonials = TESTIMONIALS.slice(0, 3);
  const shortMetrics = HERO_METRICS.slice(0, 4);
  const roadmap = WORKFLOW_STEPS.slice(0, 4);

  const offices = OFFICES.filter((item) => item.city.includes("(VN)"));

  return (
    <main className="bg-slate-50 text-slate-900">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/85 px-4 py-4 shadow-sm backdrop-blur-xl min-[1024px]:px-8">
        <div className="mx-auto flex w-full max-w-[1380px] items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-[#001f3d]">Project CLARA</span>
          </div>

          <div className="hidden items-center gap-8 min-[900px]:flex">
            <a className="border-b-2 border-[#006875] pb-1 text-sm font-semibold text-[#006875]" href="#modules">
              Modules
            </a>
            <a className="text-sm font-semibold text-slate-600 transition-colors hover:text-[#001f3d]" href="#roadmap">
              Quy trình
            </a>
            <a className="text-sm font-semibold text-slate-600 transition-colors hover:text-[#001f3d]" href="#safety">
              An toàn
            </a>
            <a className="text-sm font-semibold text-slate-600 transition-colors hover:text-[#001f3d]" href="#faq">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Tài khoản"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500"
            >
              <span className="text-sm font-semibold">AI</span>
            </button>
            <Link
              href="/register"
              className="inline-flex min-h-10 items-center rounded-lg bg-[#003461] px-5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Đặt Demo
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden px-4 pt-28 pb-20 min-[1024px]:px-8 min-[1024px]:pt-32">
        <div className="mx-auto grid w-full max-w-[1380px] items-center gap-14 min-[1024px]:grid-cols-2 min-[1280px]:gap-16">
          <div className="z-10">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-[#006875]">
              <span className="inline-block h-2 w-2 rounded-full bg-[#00daf3]" />
              Bước tiến tiếp theo của Trí tuệ Lâm sàng
            </span>

            <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight text-[#001f3d] min-[640px]:text-5xl min-[1280px]:text-7xl">
              Clinical Agent for
              <br />
              <span
                className="bg-[linear-gradient(135deg,#006875_0%,#00daf3_100%)] bg-clip-text text-transparent"
                style={{ WebkitTextFillColor: "transparent" }}
              >
                Retrieval &amp; Analysis
              </span>
            </h1>

            <p className="mb-10 max-w-xl text-lg leading-relaxed text-slate-600">
              Hệ thống AI chuyên biệt được thiết kế để giảm mệt mỏi trong lập hồ sơ và tăng cường khả năng ra quyết
              định thông qua tổng hợp lâm sàng có độ chính xác cao.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#001f3d] px-8 text-base font-bold text-white transition hover:scale-[1.02]"
              >
                Bắt đầu Thử nghiệm
                <span className="text-lg">+</span>
              </Link>
              <Link
                href="/research"
                className="inline-flex min-h-12 items-center rounded-lg border border-slate-300 px-8 text-base font-bold text-[#001f3d] transition hover:bg-slate-100"
              >
                Xem các Modules
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-20 -right-20 h-[420px] w-[420px] rounded-full bg-cyan-200/35 blur-[100px]" />
            <div
              className="relative overflow-hidden rounded-2xl border border-slate-200/70 p-1 shadow-2xl backdrop-blur-xl"
              style={{
                background: "rgba(255, 255, 255, 0.72)",
                WebkitBackdropFilter: "blur(20px)",
                boxShadow: "0 0 40px -10px rgba(0, 218, 243, 0.24)",
              }}
            >
              <img
                alt="Medical AI Data Network Visualization"
                className="h-auto w-full rounded-xl"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD66LkhRPbbJgpLVe3hHZrr0lDbw4cZYnpsxmbrYpKAG3qY5v-1PPuS_9A41uEsJK0_JCKGpVOrIIhLM9r2HyQcOSUXNGMBobzn49Gxkmc7A9CVrbtlBXMATjvWFGHx5Ld-XTiu1yy6X-KyJhAnInSdB6nhRn6ie6qrByXnQD82zuyTKQBpGpQi6hUYI7Kr4cTuXB22LlwZFoMorUqtcqBOMxUiszo3Ok6XTqwqAKhqHI3bOLMx2iw6EKyXvho50RpdC7p3pg60l2w"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-[#001f3d]/45 to-transparent p-6 min-[1024px]:p-8">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-[#00daf3]" />
                  <span className="text-xs font-mono text-white/90">CLARA_ENGINE_ACTIVE: DATA_SYNTHESIS_RUNNING</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200/80 bg-white/70 py-12">
        <div className="mx-auto w-full max-w-[1380px] px-4 min-[1024px]:px-8">
          <p className="mb-8 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            Được tin dùng bởi các đối tác hạ tầng
          </p>
          <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">
            {SPONSORS.map((sponsor) => (
              <a
                key={sponsor.name}
                href={sponsor.href}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[130px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-4 grayscale transition hover:grayscale-0"
              >
                <Image
                  src={sponsor.logo}
                  alt={`${sponsor.name} logo`}
                  width={sponsor.name === "BNIX" ? 300 : 460}
                  height={sponsor.name === "BNIX" ? 86 : 120}
                  className={sponsor.name === "BNIX" ? "h-14 w-auto object-contain" : "h-16 w-auto object-contain"}
                />
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f1f4f7] py-24" id="safety">
        <div className="mx-auto grid w-full max-w-[1380px] grid-cols-1 gap-10 px-4 min-[900px]:grid-cols-3 min-[1024px]:px-8">
          {TRUST_BADGES.map((item) => (
            <article key={item.label} className="space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-sm">
                <span className="h-2.5 w-2.5 rounded-full bg-[#00daf3]" />
              </div>
              <h3 className="text-xl font-bold text-[#001f3d]">{item.label}</h3>
              <p className="leading-relaxed text-slate-600">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#f7fafd] py-24" id="modules">
        <div className="mx-auto w-full max-w-[1380px] px-4 min-[1024px]:px-8">
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-[#001f3d]">Hệ sinh thái CLARA Modules</h2>
            <p className="mx-auto max-w-2xl text-slate-600">
              Các module kết nối chặt chẽ được thiết kế để xử lý các khía cạnh chính của quy trình lâm sàng hiện đại.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 min-[900px]:grid-cols-2 min-[1280px]:grid-cols-3">
            {MODULE_CARDS.map((module) => (
              <article
                key={module.title}
                className="group rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:shadow-xl"
              >
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f4f7] transition-colors group-hover:bg-cyan-50">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#00daf3]" />
                </div>
                <h4 className="mb-3 text-xl font-bold text-[#001f3d]">{module.title}</h4>
                <p className="mb-6 text-sm leading-relaxed text-slate-600">{clampText(module.description, 155)}</p>
                <div className="h-1 w-12 bg-slate-200 transition-all duration-300 group-hover:w-full group-hover:bg-[#00daf3]" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#001f3d] py-24 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 h-full w-full bg-[radial-gradient(circle_at_30%_50%,#00daf3,transparent_50%)]" />
        </div>
        <div className="relative z-10 mx-auto w-full max-w-[1380px] px-4 min-[1024px]:px-8">
          <div className="grid grid-cols-2 gap-12 min-[1280px]:grid-cols-4">
            {shortMetrics.map((metric) => (
              <div key={metric.label} className="text-center">
                <div
                  className="mb-2 bg-[linear-gradient(135deg,#006875_0%,#00daf3_100%)] bg-clip-text text-5xl font-black text-transparent"
                  style={{ WebkitTextFillColor: "transparent" }}
                >
                  {metric.value}
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-100">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7fafd] py-28" id="roadmap">
        <div className="mx-auto grid w-full max-w-[1380px] grid-cols-1 items-center gap-20 px-4 min-[1100px]:grid-cols-2 min-[1024px]:px-8">
          <div className="relative">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <h5 className="mb-8 text-lg font-bold text-[#001f3d]">Lộ trình triển khai 4 bước</h5>
              <div className="relative space-y-8">
                <div className="absolute top-4 bottom-4 left-[27px] w-0.5 bg-gradient-to-b from-[#00daf3] to-transparent" />
                {roadmap.map((step) => (
                  <div key={step.index} className="relative flex gap-6">
                    <div className="z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white bg-cyan-100 shadow-md">
                      <span className="font-bold text-[#001f3d]">{step.index}</span>
                    </div>
                    <div>
                      <h6 className="font-bold text-[#001f3d]">{step.title}</h6>
                      <p className="text-sm text-slate-600">{clampText(step.points[0] ?? step.outcome, 105)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h2 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-[#001f3d]">
              Được thiết kế cho
              <br />
              <span className="text-[#006875]">Kết quả Chính xác</span>
            </h2>
            <p className="mb-10 text-lg leading-relaxed text-slate-600">
              Không giống các LLM phổ thông, CLARA là hệ thống chuyên biệt cho y tế, ưu tiên độ chính xác lâm sàng và
              khả năng kiểm chứng thay vì hội thoại chung chung.
            </p>
            <div className="space-y-6">
              {[
                "Loại bỏ đáng kể gánh nặng lập hồ sơ lặp lại",
                "Rút ngắn thời gian chuẩn bị và tìm bằng chứng",
                "Truy xuất đa nguồn có kiểm chứng citation",
              ].map((line) => (
                <div key={line} className="flex items-center gap-4 rounded-xl border-l-4 border-[#00daf3] bg-[#f1f4f7] p-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#00daf3]" />
                  <span className="font-semibold text-[#001f3d]">{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f1f4f7] py-24">
        <div className="mx-auto w-full max-w-[1380px] px-4 min-[1024px]:px-8">
          <h2 className="mb-16 text-center text-3xl font-bold text-[#001f3d]">Được tin dùng bởi đội ngũ lâm sàng</h2>
          <div className="grid grid-cols-1 gap-8 min-[900px]:grid-cols-3">
            {shortTestimonials.map((item, idx) => (
              <article key={item.name} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <p className="mb-8 italic leading-relaxed text-slate-600">&quot;{item.quote}&quot;</p>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700">
                    {item.name
                      .split(" ")
                      .slice(-2)
                      .map((v) => v[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#001f3d]">{item.name}</p>
                    <p className="text-xs text-slate-500">{idx === 0 ? "Clinical Lead" : idx === 1 ? "Health IT Lead" : item.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#f7fafd] py-24" id="faq">
        <div className="mx-auto w-full max-w-4xl px-4 min-[1024px]:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-[#001f3d]">Câu hỏi Thường gặp</h2>
          <div className="space-y-4">
            {shortFaq.map((faq) => (
              <details key={faq.question} className="overflow-hidden rounded-xl border border-slate-200 bg-white group">
                <summary className="flex cursor-pointer list-none items-center justify-between p-6">
                  <span className="font-bold text-[#001f3d]">{faq.question}</span>
                  <span className="text-slate-500 transition-transform group-open:rotate-180">▾</span>
                </summary>
                <div className="px-6 pb-6 text-sm text-slate-600">{faq.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-24 min-[1024px]:px-8">
        <div
          className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#001f3d] p-10 text-center backdrop-blur-xl min-[1024px]:p-16"
          style={{
            background: "rgba(0, 31, 61, 0.92)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 0 40px -10px rgba(0, 218, 243, 0.24)",
          }}
        >
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,#00daf3,transparent_60%)]" />
          <div className="relative z-10">
            <h2 className="mb-6 text-4xl font-extrabold text-white min-[1024px]:text-5xl">
              Sẵn sàng nâng cấp
              <br />
              Trí tuệ Lâm sàng của bạn?
            </h2>
            <p className="mx-auto mb-10 max-w-xl text-lg text-blue-100/90">{FINAL_CTA.subheading}</p>
            <div className="flex justify-center gap-4">
              <Link
                href={FINAL_CTA.href}
                className="inline-flex min-h-12 items-center rounded-xl bg-[#00e3fd] px-10 text-lg font-bold text-[#00323a] transition hover:scale-105"
              >
                {FINAL_CTA.button}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="grid grid-cols-1 gap-8 border-t border-slate-200 bg-[#f1f4f7] px-6 py-14 min-[900px]:grid-cols-3 min-[1024px]:px-12">
        <div>
          <span className="mb-4 block text-lg font-bold text-[#001f3d]">Project CLARA</span>
          <p className="text-sm leading-relaxed text-slate-600">
            AI chính xác cho thực hành lâm sàng hằng ngày.
            <br />
            Được xây dựng cho môi trường vận hành thực tế.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#001f3d]">Văn phòng</span>
          {offices.slice(0, 2).map((office) => (
            <span key={office.detail} className="text-sm text-slate-600">
              {office.detail}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <span className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#001f3d]">Liên hệ</span>
          <a className="text-sm text-slate-600 transition-colors hover:text-[#006875]" href="mailto:clara@thiennn.icu">
            clara@thiennn.icu
          </a>
          <a className="text-sm text-slate-600 transition-colors hover:text-[#006875]" href="tel:0853374247">
            0853374247
          </a>
          <div className="mt-4 border-t border-slate-200 pt-4">
            <span className="text-xs text-slate-500">© 2026 Project CLARA. Bảo lưu mọi quyền.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
