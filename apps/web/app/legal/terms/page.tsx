import LegalPageShell from "@/components/legal/legal-page-shell";

const UPDATED_AT = "06/04/2026";

export default function TermsOfServicePage() {
  return (
    <LegalPageShell
      title="Điều khoản sử dụng (ToS)"
      summary="Khi truy cập hoặc sử dụng Project CLARA, bạn đồng ý tuân thủ các điều khoản dưới đây."
      updatedAt={UPDATED_AT}
    >
      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">1. Chấp thuận điều khoản</h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          Việc tạo tài khoản hoặc tiếp tục sử dụng dịch vụ đồng nghĩa bạn đã đọc và đồng ý với điều khoản sử dụng, chính
          sách quyền riêng tư và đồng thuận y tế hiện hành.
        </p>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">2. Tài khoản và trách nhiệm</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
          <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động trên tài khoản của mình.</li>
          <li>Bạn cần cung cấp thông tin chính xác, cập nhật và không mạo danh cá nhân/tổ chức khác.</li>
          <li>Không chia sẻ tài khoản cho mục đích trái phép hoặc vi phạm quy định của hệ thống.</li>
        </ul>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">3. Phạm vi sử dụng được phép</h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          Project CLARA được cung cấp để hỗ trợ tra cứu, tổng hợp thông tin và vận hành luồng công việc y tế. Bạn không
          được sử dụng dịch vụ để phát tán nội dung trái pháp luật, gây hại hệ thống hoặc xâm phạm quyền của bên khác.
        </p>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">4. Miễn trừ trách nhiệm y tế</h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          CLARA là công cụ hỗ trợ tham khảo và không thay thế bác sĩ trong chẩn đoán, kê đơn hoặc chỉ định điều trị.
          Quyết định lâm sàng cuối cùng thuộc về chuyên gia y tế và cơ sở điều trị.
        </p>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">5. Giới hạn trách nhiệm</h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          Trong phạm vi pháp luật cho phép, Project CLARA không chịu trách nhiệm cho thiệt hại gián tiếp phát sinh từ
          việc sử dụng thông tin tham khảo nếu người dùng bỏ qua bước kiểm chứng chuyên môn cần thiết.
        </p>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">6. Quyền sở hữu trí tuệ</h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          Mọi thành phần phần mềm, giao diện và tài liệu thuộc quyền sở hữu hợp pháp của Project CLARA hoặc đối tác cấp
          phép. Bạn không được sao chép, phân phối hoặc khai thác thương mại khi chưa có chấp thuận.
        </p>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">7. Thay đổi điều khoản</h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          Điều khoản có thể được cập nhật định kỳ. Phiên bản mới sẽ được công bố tại trang pháp lý và có hiệu lực từ thời
          điểm đăng tải.
        </p>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">8. Liên hệ</h2>
        <p className="mt-2 text-sm leading-7 text-slate-700">
          Nếu cần làm rõ điều khoản, vui lòng liên hệ{" "}
          <a className="font-semibold text-blue-700 hover:underline" href="mailto:clara@thiennn.icu">
            clara@thiennn.icu
          </a>
          .
        </p>
      </article>
    </LegalPageShell>
  );
}

