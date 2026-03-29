import { UserRole } from "@/lib/auth-store";
import { ResearchFlowStage } from "@/lib/research";

export const ROLE_LABELS: Record<UserRole, string> = {
  normal: "Người dùng cá nhân",
  researcher: "Nhà nghiên cứu",
  doctor: "Bác sĩ",
  admin: "Quản trị hệ thống",
};

export const SUGGESTED_QUERIES = [
  "So sánh DASH và Mediterranean cho bệnh tim mạch",
  "Tóm tắt guideline tăng huyết áp mới nhất từ tài liệu đã tải",
  "Liệt kê các cảnh báo tương tác thuốc quan trọng trong dữ liệu"
] as const;

export const LOCAL_FLOW_BLUEPRINT: Array<Pick<ResearchFlowStage, "id" | "label" | "detail">> = [
  {
    id: "scope_question",
    label: "Scope Question",
    detail: "Chuẩn hóa truy vấn và xác định phạm vi phân tích."
  },
  {
    id: "collect_evidence",
    label: "Collect Evidence",
    detail: "Tổng hợp nguồn từ knowledge source và tài liệu upload."
  },
  {
    id: "synthesize_findings",
    label: "Synthesize Findings",
    detail: "Tổng hợp các điểm đồng thuận và bất đồng."
  },
  {
    id: "verification",
    label: "Verification",
    detail: "Đối chiếu consistency và độ tin cậy của câu trả lời."
  },
  {
    id: "final_response",
    label: "Final Response",
    detail: "Hoàn thiện câu trả lời có citation và metadata."
  }
];
