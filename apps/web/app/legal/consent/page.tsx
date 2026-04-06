import LegalPageShell from "@/components/legal/legal-page-shell";

const UPDATED_AT = "06/04/2026";

export default function MedicalConsentPage() {
  return (
    <LegalPageShell
      title="Đồng thuận sử dụng y tế"
      summary="Tài liệu này áp dụng cho các tính năng có rủi ro lâm sàng như Self-Med, CareGuard và các luồng liên quan đến an toàn thuốc."
      updatedAt={UPDATED_AT}
    >
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">1. Bản chất của hệ thống</h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          Project CLARA là công cụ hỗ trợ tham khảo. Nội dung do hệ thống tạo ra không thay thế tư vấn trực tiếp của bác
          sĩ và không được xem là chỉ định điều trị cuối cùng.
        </p>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">2. Cam kết của người dùng khi đồng thuận</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
          <li>Không dùng CLARA để tự chẩn đoán hoặc tự kê đơn.</li>
          <li>Luôn kiểm chứng thông tin trước khi áp dụng vào quyết định chuyên môn.</li>
          <li>Liên hệ cơ sở y tế khi có dấu hiệu cấp cứu hoặc bất thường nghiêm trọng.</li>
        </ul>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">3. Tình huống khẩn cấp</h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          Nếu xuất hiện các triệu chứng cấp cứu (khó thở nặng, đau ngực dữ dội, rối loạn ý thức, co giật, sốc phản vệ...),
          bạn cần gọi cấp cứu hoặc đến cơ sở y tế gần nhất ngay lập tức.
        </p>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">4. Dữ liệu liên quan đến đồng thuận</h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          Hệ thống lưu trạng thái đồng thuận (phiên bản điều khoản, thời điểm chấp thuận, user context) để phục vụ kiểm
          soát truy cập, audit và tuân thủ vận hành.
        </p>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">5. Rút lại đồng thuận</h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          Bạn có thể liên hệ quản trị hệ thống để yêu cầu cập nhật trạng thái đồng thuận. Một số tính năng an toàn thuốc
          có thể bị khóa cho đến khi đồng thuận được xác nhận lại.
        </p>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">6. Liên hệ hỗ trợ</h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          Nếu cần hỗ trợ về nội dung đồng thuận, vui lòng gửi email tới{" "}
          <a className="font-semibold text-blue-700 hover:underline" href="mailto:clara@thiennn.icu">
            clara@thiennn.icu
          </a>
          .
        </p>
      </article>
    </LegalPageShell>
  );
}

