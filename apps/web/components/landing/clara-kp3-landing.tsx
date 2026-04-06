import Image from "next/image";
import Link from "next/link";

import { SPONSORS } from "@/components/landing/clara-kp3-data";

export default function ClaraKp3Landing() {
  const flowSteps = [
    {
      title: "Đặt câu hỏi lâm sàng",
      detail: "Nhập câu hỏi tự do hoặc chọn prompt mẫu theo guideline, thuốc, ca bệnh.",
    },
    {
      title: "Truy xuất và chấm độ tin cậy",
      detail: "CLARA lấy nguồn liên quan, rerank theo ngữ cảnh và gắn mức tin cậy theo từng luận điểm.",
    },
    {
      title: "Nhận câu trả lời có citation",
      detail: "Mỗi luận điểm đi kèm nguồn tham chiếu và phần giới hạn để kiểm tra nhanh trước khi dùng.",
    },
  ] as const;

  const metrics = [
    { label: "Câu trả lời có citation", value: "95%+" },
    { label: "Median response time", value: "< 20s" },
    { label: "Nguồn y khoa chuẩn hóa", value: "8+" },
    { label: "Luồng thao tác chính", value: "3 bước" },
  ] as const;

  const testimonials = [
    {
      name: "Trần Đức Phúc",
      role: "Sinh viên Y6",
      quote: "Mình không còn phải mở quá nhiều tab để tìm nguồn. Câu trả lời có citation giúp làm seminar nhanh và chắc hơn.",
    },
    {
      name: "BS. Nguyễn Hoài Nam",
      role: "Bác sĩ Nội tổng quát",
      quote: "Phần mạnh nhất là tách rõ kết luận, nguồn tham chiếu và giới hạn. Dùng trong chuẩn bị hội chẩn rất ổn.",
    },
    {
      name: "Dương Quốc Bảo",
      role: "Research Assistant",
      quote: "Research flow gọn, follow-up tự nhiên và kiểm tra nguồn rất nhanh khi cần đối chiếu nhiều guideline.",
    },
  ] as const;

  const faqs = [
    {
      q: "CLARA có thay thế quyết định bác sĩ không?",
      a: "Không. CLARA là trợ lý Research và Chatbot có citation để hỗ trợ tham khảo. Quyết định chuyên môn cuối cùng vẫn do bác sĩ và cơ sở y tế.",
    },
    {
      q: "Điểm khác biệt so với chatbot thông thường là gì?",
      a: "CLARA tối ưu cho truy xuất bằng chứng: câu trả lời ưu tiên nguồn, hiển thị mức tin cậy và nêu rõ giới hạn khi thiếu dữ liệu.",
    },
    {
      q: "Bắt đầu onboarding nên đi từ đâu?",
      a: "Bắt đầu từ flow Research 3 bước: hỏi, kiểm chứng citation, chốt ghi chú. Khi KPI ổn định mới mở rộng sang Council hoặc SelfMed.",
    },
  ] as const;

  return (
    <main className="relative overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-36 -top-28 h-80 w-80 rounded-full bg-cyan-200/55 blur-3xl dark:bg-cyan-900/35" />
        <div className="absolute right-0 top-16 h-[26rem] w-[26rem] rounded-full bg-blue-200/45 blur-3xl dark:bg-blue-900/25" />
      </div>

      <nav className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/85 bg-white/90 px-4 py-4 backdrop-blur-xl dark:border-slate-800/85 dark:bg-slate-950/85 min-[1024px]:px-8">
        <div className="mx-auto flex w-full max-w-[1320px] items-center justify-between gap-3">
          <span className="text-xl font-black tracking-tight">Project CLARA</span>

          <div className="hidden items-center gap-8 min-[900px]:flex">
            <a className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" href="#flow">
              Flow
            </a>
            <a className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" href="#workspace">
              Workspace
            </a>
            <a className="text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-white" href="#faq">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/research"
              className="inline-flex min-h-10 items-center rounded-lg bg-slate-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
            >
              Mở Research
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative px-4 pb-20 pt-28 min-[1024px]:px-8 min-[1024px]:pt-32">
        <div className="mx-auto grid w-full max-w-[1320px] items-center gap-12 min-[1100px]:grid-cols-2">
          <div className="relative z-10">
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-sm font-semibold text-cyan-800 dark:border-cyan-900/60 dark:bg-cyan-950/40 dark:text-cyan-200">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-500 dark:bg-cyan-300" />
              Research Chatbot cho y khoa
            </span>

            <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight min-[640px]:text-5xl min-[1280px]:text-6xl">
              Hỏi nhanh.
              <br />
              Trả lời có kiểm chứng.
              <br />
              <span className="text-cyan-700 dark:text-cyan-300">Citation ngay trong hội thoại.</span>
            </h1>

            <p className="mb-8 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
              Project CLARA giúp bạn truy xuất bằng chứng y khoa, tóm tắt theo ngữ cảnh lâm sàng và nêu rõ giới hạn
              phản hồi. Tập trung vào một flow đơn giản: hỏi, kiểm chứng, hành động.
            </p>

            <div className="mb-8 flex flex-wrap gap-4">
              <Link
                href="/research"
                className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-slate-900 px-8 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
              >
                Bắt đầu phiên Research
              </Link>
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center rounded-xl border border-slate-300 bg-white px-8 text-base font-bold text-slate-900 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Đăng ký pilot
              </Link>
            </div>

            <div className="flex flex-wrap gap-3">
              {["Guideline synthesis", "Drug interaction summary", "Case discussion prep"].map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="relative z-10 rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_24px_70px_-45px_rgba(15,23,42,0.55)] dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-3 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 dark:border-slate-700 dark:bg-slate-950">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                CLARA Research Workspace
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300">
                Live
              </span>
            </div>

            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
              <div className="max-w-[90%] rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200">
                Bệnh nhân tăng huyết áp đang dùng Amlodipine + Simvastatin. Nguy cơ tương tác và hướng xử trí?
              </div>

              <div className="ml-auto max-w-[94%] rounded-2xl border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-900/60 dark:bg-cyan-950/35">
                <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100">
                  Có nguy cơ tăng nồng độ Simvastatin khi phối hợp với Amlodipine. Nên cân nhắc giới hạn liều
                  Simvastatin và theo dõi triệu chứng đau cơ.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["Citation 01", "Citation 02", "Guideline note"].map((chip) => (
                    <span
                      key={chip}
                      className="rounded-md border border-cyan-300/70 bg-white px-2 py-1 text-[11px] font-semibold text-cyan-800 dark:border-cyan-700 dark:bg-slate-900 dark:text-cyan-200"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Confidence: Medium-high | Verify on local protocol
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                  Quick prompts
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "So sánh guideline A vs B",
                    "Tóm tắt nghiên cứu trong 6 tháng gần đây",
                    "Liệt kê yếu tố cần escalate",
                  ].map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/70 py-12 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="mx-auto w-full max-w-[1320px] px-4 min-[1024px]:px-8">
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
                className="flex min-h-[124px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-4 transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-slate-700 dark:bg-slate-950"
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

      <section className="bg-slate-50 py-24 dark:bg-slate-950" id="flow">
        <div className="mx-auto w-full max-w-[1320px] px-4 min-[1024px]:px-8">
          <div className="mb-14 text-center">
            <h2 className="mb-4 text-3xl font-extrabold tracking-tight min-[900px]:text-4xl">
              Một flow duy nhất cho Research Chatbot
            </h2>
            <p className="mx-auto max-w-2xl text-slate-600 dark:text-slate-300">
              Thiết kế để bạn đi từ câu hỏi đến bằng chứng mà không bị rối: nhập câu hỏi, kiểm tra citation, chốt
              quyết định.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-7 min-[900px]:grid-cols-3">
            {flowSteps.map((step, idx) => (
              <article
                key={step.title}
                className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-100 text-sm font-bold text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200">
                  {idx + 1}
                </div>
                <h3 className="mb-3 text-xl font-bold">{step.title}</h3>
                <p className="text-slate-600 dark:text-slate-300">{step.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24 dark:bg-slate-900" id="workspace">
        <div className="mx-auto w-full max-w-[1320px] px-4 min-[1024px]:px-8">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-cyan-700 dark:text-cyan-300">
                Evidence Workspace
              </p>
              <h2 className="text-3xl font-extrabold tracking-tight min-[900px]:text-4xl">
                Giao diện rõ ràng cho câu trả lời và citation
              </h2>
            </div>
            <Link
              href="/research"
              className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Xem trong app
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 min-[1100px]:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-950">
              <div className="mb-5 flex items-center gap-2">
                {["Answer", "Citations", "Deep Dive"].map((tab, idx) => (
                  <span
                    key={tab}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      idx === 0
                        ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {tab}
                  </span>
                ))}
              </div>
              <h3 className="mb-2 text-xl font-bold">Tóm tắt câu trả lời theo luận điểm</h3>
              <p className="mb-4 text-slate-600 dark:text-slate-300">
                Mỗi đoạn trả lời được map nguồn tương ứng, hạn chế overclaim và giảm thời gian kiểm tra thủ công.
              </p>
              <div className="space-y-3">
                {[
                  "Luận điểm 1: Cơ chế tương tác thuốc và mức độ ảnh hưởng lâm sàng.",
                  "Luận điểm 2: Khuyến nghị theo guideline và ngưỡng cần theo dõi.",
                  "Luận điểm 3: Điều kiện cần escalation sang bác sĩ chuyên khoa.",
                ].map((point) => (
                  <div
                    key={point}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {point}
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-950">
              <h3 className="mb-4 text-xl font-bold">Citation Panel</h3>
              <div className="space-y-3">
                {[
                  "PubMed: PMID 30588647",
                  "openFDA: Drug interaction label",
                  "Bộ Y tế: Hướng dẫn điều trị",
                ].map((ref) => (
                  <div
                    key={ref}
                    className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                  >
                    {ref}
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                Nếu thiếu dữ liệu nền, hệ thống sẽ hạ confidence và yêu cầu xác minh thêm.
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-24 dark:bg-slate-950">
        <div className="mx-auto w-full max-w-[1320px] px-4 min-[1024px]:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight min-[900px]:text-4xl">Chỉ số quan trọng cho Research</h2>
          </div>
          <div className="grid grid-cols-2 gap-5 min-[1024px]:grid-cols-4">
            {metrics.map((metric) => (
              <article key={metric.label} className="rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-slate-700 dark:bg-slate-900">
                <div className="mb-2 text-4xl font-black text-cyan-700 dark:text-cyan-300">{metric.value}</div>
                <p className="text-xs font-bold uppercase tracking-[0.13em] text-slate-600 dark:text-slate-300">{metric.label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24 dark:bg-slate-900">
        <div className="mx-auto w-full max-w-[1320px] px-4 min-[1024px]:px-8">
          <h2 className="mb-14 text-center text-3xl font-bold min-[900px]:text-4xl">Đội ngũ y khoa nói gì về CLARA Research</h2>
          <div className="grid grid-cols-1 gap-8 min-[1000px]:grid-cols-3">
            {testimonials.map((item) => (
              <article key={item.name} className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-950">
                <p className="mb-7 text-lg leading-relaxed text-slate-700 dark:text-slate-200">&quot;{item.quote}&quot;</p>
                <div>
                  <p className="text-sm font-bold">{item.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{item.role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24 dark:bg-slate-900" id="faq">
        <div className="mx-auto w-full max-w-4xl px-4 min-[1024px]:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold">Câu hỏi thường gặp</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details key={faq.q} className="group overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950">
                <summary className="flex cursor-pointer list-none items-center justify-between p-6">
                  <span className="font-bold">{faq.q}</span>
                  <span className="text-slate-500 transition-transform group-open:rotate-180 dark:text-slate-300">▾</span>
                </summary>
                <div className="px-6 pb-6 text-sm text-slate-600 dark:text-slate-300">{faq.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-24 min-[1024px]:px-8">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-slate-200 bg-slate-900 p-10 text-center min-[1024px]:p-16 dark:border-slate-700 dark:bg-slate-950">
          <h2 className="mb-6 text-4xl font-extrabold text-white min-[1024px]:text-5xl dark:text-slate-100">
            Từ câu hỏi đến bằng chứng,
            <br />
            trong một màn hình duy nhất.
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-slate-200 dark:text-slate-300">
            Bắt đầu với Research Chatbot để chuẩn hóa luồng hỏi đáp có citation. Sau đó mở rộng Council hoặc SelfMed
            theo dữ liệu vận hành thực tế.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/research"
              className="inline-flex min-h-12 items-center rounded-xl bg-cyan-400 px-10 text-lg font-bold text-slate-900 transition-colors hover:bg-cyan-300 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400"
            >
              Bắt đầu Research ngay
            </Link>
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center rounded-xl border border-slate-600 px-10 text-lg font-bold text-slate-100 transition-colors hover:bg-slate-800 dark:border-slate-500 dark:hover:bg-slate-900"
            >
              Đăng ký pilot
            </Link>
          </div>
        </div>
      </section>

      <footer className="grid grid-cols-1 gap-8 border-t border-slate-200 bg-slate-100 px-6 py-14 min-[900px]:grid-cols-3 min-[1024px]:px-12 dark:border-slate-800 dark:bg-slate-950">
        <div>
          <span className="mb-4 block text-lg font-bold">Project CLARA</span>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Clinical Agent for Retrieval &amp; Analysis.
            <br />
            Tập trung vào Research Chatbot có citation.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="mb-2 text-xs font-bold uppercase tracking-[0.16em]">Luồng cốt lõi</span>
          <span className="text-sm text-slate-600 dark:text-slate-300">Ask question</span>
          <span className="text-sm text-slate-600 dark:text-slate-300">Verify citations</span>
          <span className="text-sm text-slate-600 dark:text-slate-300">Deliver decision-ready summary</span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="mb-2 text-xs font-bold uppercase tracking-[0.16em]">Liên hệ</span>
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
