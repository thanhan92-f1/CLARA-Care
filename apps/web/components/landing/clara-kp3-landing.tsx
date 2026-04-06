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
    <main className="bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200 bg-white/95 px-4 py-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/95 min-[1024px]:px-8">
        <div className="mx-auto flex w-full max-w-[1380px] items-center justify-between gap-3">
          <span className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">Project CLARA</span>

          <div className="hidden items-center gap-8 min-[900px]:flex">
            <a className="border-b-2 border-cyan-700 pb-1 text-sm font-semibold text-cyan-700 dark:border-cyan-400 dark:text-cyan-300" href="#modules">
              Modules
            </a>
            <a className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" href="#roadmap">
              Quy trình
            </a>
            <a className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" href="#safety">
              An toàn
            </a>
            <a className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" href="#faq">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Tài khoản"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            >
              AI
            </button>
            <Link
              href="/register"
              className="inline-flex min-h-10 items-center rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
            >
              Đặt Demo
            </Link>
          </div>
        </div>
      </nav>

      <section className="px-4 pb-20 pt-28 min-[1024px]:px-8 min-[1024px]:pt-32">
        <div className="mx-auto grid w-full max-w-[1380px] items-center gap-14 min-[1024px]:grid-cols-2 min-[1280px]:gap-16">
          <div>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-500 dark:bg-cyan-300" />
              Bước tiến tiếp theo của Trí tuệ Lâm sàng
            </span>

            <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-slate-100 min-[640px]:text-5xl min-[1280px]:text-7xl">
              Clinical Agent for
              <br />
              <span className="text-cyan-700 dark:text-cyan-300">Retrieval &amp; Analysis</span>
            </h1>

            <p className="mb-10 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Hệ thống AI chuyên biệt được thiết kế để giảm mệt mỏi trong lập hồ sơ và tăng cường khả năng ra quyết
              định thông qua tổng hợp lâm sàng có độ chính xác cao.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center gap-2 rounded-lg bg-slate-900 px-8 text-base font-bold text-white hover:bg-slate-800 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
              >
                Bắt đầu Thử nghiệm
              </Link>
              <Link
                href="/research"
                className="inline-flex min-h-12 items-center rounded-lg border border-slate-300 px-8 text-base font-bold text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Xem các Modules
              </Link>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <img
              alt="Medical AI Data Network Visualization"
              className="h-auto w-full rounded-xl"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD66LkhRPbbJgpLVe3hHZrr0lDbw4cZYnpsxmbrYpKAG3qY5v-1PPuS_9A41uEsJK0_JCKGpVOrIIhLM9r2HyQcOSUXNGMBobzn49Gxkmc7A9CVrbtlBXMATjvWFGHx5Ld-XTiu1yy6X-KyJhAnInSdB6nhRn6ie6qrByXnQD82zuyTKQBpGpQi6hUYI7Kr4cTuXB22LlwZFoMorUqtcqBOMxUiszo3Ok6XTqwqAKhqHI3bOLMx2iw6EKyXvho50RpdC7p3pg60l2w"
            />
            <div className="-mt-14 px-6 pb-4 text-xs font-mono text-white min-[1024px]:px-8">
              <span className="rounded bg-slate-900/65 px-2 py-1">CLARA_ENGINE_ACTIVE: DATA_SYNTHESIS_RUNNING</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-12 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto w-full max-w-[1380px] px-4 min-[1024px]:px-8">
          <p className="mb-8 text-center text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            Đối tác hạ tầng
          </p>
          <div className="grid grid-cols-1 gap-4 min-[900px]:grid-cols-2">
            {SPONSORS.map((sponsor) => (
              <a
                key={sponsor.name}
                href={sponsor.href}
                target="_blank"
                rel="noreferrer"
                className="flex min-h-[130px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-4 dark:border-slate-700 dark:bg-slate-950"
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

      <section className="bg-slate-50 py-24 dark:bg-slate-950" id="safety">
        <div className="mx-auto grid w-full max-w-[1380px] grid-cols-1 gap-10 px-4 min-[900px]:grid-cols-3 min-[1024px]:px-8">
          {TRUST_BADGES.map((item) => (
            <article key={item.label} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 dark:bg-cyan-950/40">
                <span className="h-2.5 w-2.5 rounded-full bg-cyan-600 dark:bg-cyan-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{item.label}</h3>
              <p className="leading-relaxed text-slate-600 dark:text-slate-300">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-24 dark:bg-slate-900" id="modules">
        <div className="mx-auto w-full max-w-[1380px] px-4 min-[1024px]:px-8">
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-4xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">Hệ sinh thái CLARA Modules</h2>
            <p className="mx-auto max-w-2xl text-slate-600 dark:text-slate-300">
              Các module kết nối chặt chẽ được thiết kế để xử lý các khía cạnh chính của quy trình lâm sàng hiện đại.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 min-[900px]:grid-cols-2 min-[1280px]:grid-cols-3">
            {MODULE_CARDS.map((module) => (
              <article key={module.title} className="group rounded-2xl border border-slate-200 bg-white p-8 shadow-sm hover:shadow-md dark:border-slate-700 dark:bg-slate-950">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-600 dark:bg-cyan-300" />
                </div>
                <h4 className="mb-3 text-xl font-bold text-slate-900 dark:text-slate-100">{module.title}</h4>
                <p className="mb-6 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{clampText(module.description, 155)}</p>
                <div className="h-1 w-12 bg-slate-200 transition-all duration-300 group-hover:w-full group-hover:bg-cyan-600 dark:bg-slate-700 dark:group-hover:bg-cyan-300" />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-24 dark:bg-slate-950">
        <div className="mx-auto w-full max-w-[1380px] px-4 min-[1024px]:px-8">
          <div className="grid grid-cols-2 gap-5 min-[1024px]:grid-cols-4">
            {shortMetrics.map((metric) => (
              <article key={metric.label} className="rounded-xl border border-slate-200 bg-white p-5 text-center dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-2 text-4xl font-black text-cyan-700 dark:text-cyan-300">{metric.value}</div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-600 dark:text-slate-300">{metric.label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-28 dark:bg-slate-900" id="roadmap">
        <div className="mx-auto grid w-full max-w-[1380px] grid-cols-1 items-center gap-20 px-4 min-[1100px]:grid-cols-2 min-[1024px]:px-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-950">
            <h5 className="mb-8 text-lg font-bold text-slate-900 dark:text-slate-100">Lộ trình triển khai 4 bước</h5>
            <div className="relative space-y-8">
              <div className="absolute bottom-4 left-[27px] top-4 w-0.5 bg-gradient-to-b from-cyan-500 to-transparent" />
              {roadmap.map((step) => (
                <div key={step.index} className="relative flex gap-6">
                  <div className="z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4 border-white bg-cyan-100 shadow-md dark:border-slate-950 dark:bg-cyan-950/40">
                    <span className="font-bold text-slate-900 dark:text-slate-100">{step.index}</span>
                  </div>
                  <div>
                    <h6 className="font-bold text-slate-900 dark:text-slate-100">{step.title}</h6>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{clampText(step.points[0] ?? step.outcome, 105)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-slate-100">
              Được thiết kế cho
              <br />
              <span className="text-cyan-700 dark:text-cyan-300">Kết quả Chính xác</span>
            </h2>
            <p className="mb-10 text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Không giống các LLM phổ thông, CLARA là hệ thống chuyên biệt cho y tế, ưu tiên độ chính xác lâm sàng và
              khả năng kiểm chứng thay vì hội thoại chung chung.
            </p>
            <div className="space-y-6">
              {[
                "Loại bỏ đáng kể gánh nặng lập hồ sơ lặp lại",
                "Rút ngắn thời gian chuẩn bị và tìm bằng chứng",
                "Truy xuất đa nguồn có kiểm chứng citation",
              ].map((line) => (
                <div key={line} className="flex items-center gap-4 rounded-xl border-l-4 border-cyan-600 bg-slate-50 p-4 dark:border-cyan-400 dark:bg-slate-800">
                  <span className="h-2.5 w-2.5 rounded-full bg-cyan-600 dark:bg-cyan-300" />
                  <span className="font-semibold text-slate-900 dark:text-slate-100">{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-24 dark:bg-slate-950">
        <div className="mx-auto w-full max-w-[1380px] px-4 min-[1024px]:px-8">
          <h2 className="mb-16 text-center text-3xl font-bold text-slate-900 dark:text-slate-100">Được tin dùng bởi đội ngũ lâm sàng</h2>
          <div className="grid grid-cols-1 gap-8 min-[900px]:grid-cols-3">
            {shortTestimonials.map((item, idx) => (
              <article key={item.name} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <p className="mb-8 italic leading-relaxed text-slate-600 dark:text-slate-300">&quot;{item.quote}&quot;</p>
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                    {item.name
                      .split(" ")
                      .slice(-2)
                      .map((v) => v[0])
                      .join("")}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">{idx === 0 ? "Clinical Lead" : idx === 1 ? "Health IT Lead" : item.role}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24 dark:bg-slate-900" id="faq">
        <div className="mx-auto w-full max-w-4xl px-4 min-[1024px]:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-slate-900 dark:text-slate-100">Câu hỏi Thường gặp</h2>
          <div className="space-y-4">
            {shortFaq.map((faq) => (
              <details key={faq.question} className="group overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
                <summary className="flex cursor-pointer list-none items-center justify-between p-6">
                  <span className="font-bold text-slate-900 dark:text-slate-100">{faq.question}</span>
                  <span className="text-slate-500 transition-transform group-open:rotate-180 dark:text-slate-300">▾</span>
                </summary>
                <div className="px-6 pb-6 text-sm text-slate-600 dark:text-slate-300">{faq.answer}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-24 min-[1024px]:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-slate-900 p-10 text-center min-[1024px]:p-16 dark:border-slate-700 dark:bg-slate-950">
          <h2 className="mb-6 text-4xl font-extrabold text-white min-[1024px]:text-5xl dark:text-slate-100">
            Sẵn sàng nâng cấp
            <br />
            Trí tuệ Lâm sàng của bạn?
          </h2>
          <p className="mx-auto mb-10 max-w-xl text-lg text-slate-200 dark:text-slate-300">{FINAL_CTA.subheading}</p>
          <div className="flex justify-center gap-4">
            <Link
              href={FINAL_CTA.href}
              className="inline-flex min-h-12 items-center rounded-xl bg-cyan-400 px-10 text-lg font-bold text-slate-900 hover:bg-cyan-300 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
            >
              {FINAL_CTA.button}
            </Link>
          </div>
        </div>
      </section>

      <footer className="grid grid-cols-1 gap-8 border-t border-slate-200 bg-slate-100 px-6 py-14 min-[900px]:grid-cols-3 min-[1024px]:px-12 dark:border-slate-800 dark:bg-slate-950">
        <div>
          <span className="mb-4 block text-lg font-bold text-slate-900 dark:text-slate-100">Project CLARA</span>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            AI chính xác cho thực hành lâm sàng hằng ngày.
            <br />
            Được xây dựng cho môi trường vận hành thực tế.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-900 dark:text-slate-100">Văn phòng</span>
          {offices.slice(0, 2).map((office) => (
            <span key={office.detail} className="text-sm text-slate-600 dark:text-slate-300">
              {office.detail}
            </span>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <span className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-slate-900 dark:text-slate-100">Liên hệ</span>
          <a className="text-sm text-slate-600 hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300" href="mailto:clara@thiennn.icu">
            clara@thiennn.icu
          </a>
          <a className="text-sm text-slate-600 hover:text-cyan-700 dark:text-slate-300 dark:hover:text-cyan-300" href="tel:0853374247">
            0853374247
          </a>
          <div className="mt-4 border-t border-slate-200 pt-4 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400">© 2026 Project CLARA. Bảo lưu mọi quyền.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
