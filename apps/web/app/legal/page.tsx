import Link from "next/link";

const LEGAL_ITEMS = [
  {
    href: "/legal/privacy",
    title: "Chính sách quyền riêng tư",
    detail: "Giải thích dữ liệu nào được thu thập, mục đích sử dụng, thời gian lưu trữ và quyền của người dùng.",
  },
  {
    href: "/legal/terms",
    title: "Điều khoản sử dụng (ToS)",
    detail: "Quy định quyền và trách nhiệm khi dùng Project CLARA, giới hạn sử dụng và phạm vi trách nhiệm.",
  },
  {
    href: "/legal/consent",
    title: "Đồng thuận sử dụng y tế",
    detail: "Điều khoản bắt buộc trước khi dùng các tính năng liên quan an toàn thuốc và hỗ trợ lâm sàng.",
  },
  {
    href: "/legal/cookies",
    title: "Chính sách cookie",
    detail: "Mô tả các cookie cần thiết và cách bạn có thể kiểm soát cài đặt cookie trên thiết bị.",
  },
] as const;

export default function LegalHubPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-6 px-6 py-10">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Project CLARA - Legal</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Trung tâm pháp lý</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Các tài liệu bên dưới giúp bạn nắm rõ cách CLARA xử lý dữ liệu, quyền và nghĩa vụ khi sử dụng sản phẩm.
        </p>
        <div className="mt-4">
          <Link href="/" className="text-sm font-semibold text-blue-700 hover:underline">
            Quay lại trang chủ
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {LEGAL_ITEMS.map((item) => (
          <article key={item.href} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">{item.title}</h2>
            <p className="mt-2 text-sm leading-7 text-slate-600">{item.detail}</p>
            <Link href={item.href} className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline">
              Xem chi tiết
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}

