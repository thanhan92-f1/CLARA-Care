export type HeroMetric = {
  label: string;
  value: string;
  note?: string;
};

export type ProblemPoint = {
  title: string;
  description: string;
  consequence: string;
};

export type WorkflowStep = {
  index: string;
  title: string;
  subtitle: string;
  points: string[];
  outcome: string;
};

export type ModuleCard = {
  tag: string;
  title: string;
  description: string;
  bullets: string[];
  cta: string;
  href: string;
};

export type RoiMetric = {
  label: string;
  target: string;
  note: string;
};

export type SafetyGuardrail = {
  title: string;
  description: string;
};

export type Integration = {
  name: string;
  category: string;
  description: string;
};

export type Testimonial = {
  name: string;
  role: string;
  channel: string;
  quote: string;
};

export type FaqItem = {
  question: string;
  answer: string;
};

export type Office = {
  city: string;
  detail: string;
};

export type Sponsor = {
  name: string;
  href: string;
  logo: string;
};

export type FinalCta = {
  heading: string;
  subheading: string;
  button: string;
  href: string;
  secondaryButton?: string;
  secondaryHref?: string;
};

export const HERO_METRICS = [
  { label: "Khởi tạo pilot có KPI", value: "7-14 ngày", note: "Tùy mức sẵn sàng dữ liệu và đội vận hành." },
  { label: "Onboard nhóm dùng thử", value: "< 30 phút", note: "Bao gồm cấu hình vai trò cơ bản." },
  { label: "Dashboard theo dõi chuyển đổi", value: "12 chỉ số cốt lõi" },
  { label: "Workshop khởi động", value: "60 phút", note: "Tập trung vào use-case có thể đo." },
] as const satisfies readonly HeroMetric[];

export const PROBLEM_POINTS = [
  {
    title: "Thông tin y khoa phân mảnh",
    description: "Nguồn guideline, nghiên cứu và tài liệu nội bộ nằm rải rác nên khó truy xuất đồng nhất.",
    consequence: "Đội ngũ mất thời gian tìm nguồn trước khi ra quyết định.",
  },
  {
    title: "Hội chẩn thiếu quy trình chuẩn",
    description: "Mỗi ca đang được xử lý theo thói quen cá nhân, thiếu flow kiểm chứng và tổng hợp rõ ràng.",
    consequence: "Khó so sánh chất lượng giữa các ca và các kíp trực.",
  },
  {
    title: "Rủi ro tương tác thuốc tại nhà",
    description: "Bệnh nhân mạn tính thường dùng nhiều thuốc cùng lúc nhưng không có cảnh báo thống nhất.",
    consequence: "Dễ phát sinh sai sót do trùng hoạt chất hoặc sai thời điểm dùng.",
  },
  {
    title: "Triển khai AI thiếu đo lường thực tế",
    description: "Nhiều hệ thống dừng ở demo vì không gắn KPI vận hành ngay từ đầu.",
    consequence: "Khó chứng minh hiệu quả để mở rộng ngân sách và phạm vi.",
  },
] as const satisfies readonly ProblemPoint[];

export const WORKFLOW_STEPS = [
  {
    index: "01",
    title: "Khoanh use-case chuyển đổi",
    subtitle: "BẮT ĐẦU TỪ MỘT ĐIỂM ĐAU CỤ THỂ",
    points: [
      "Chọn 1 luồng ưu tiên: Research, Council, SelfMed hoặc CareGuard.",
      "Xác định baseline trước pilot: thời gian xử lý, tỷ lệ lỗi, tỷ lệ hoàn tất.",
      "Gắn owner theo vai trò để tránh pilot kéo dài không quyết định."
    ],
    outcome: "Có mục tiêu và ngưỡng đo rõ ngay từ tuần đầu.",
  },
  {
    index: "02",
    title: "Kết nối nguồn tri thức",
    subtitle: "RAG ĐA NGUỒN, CÓ TRUY VẾT",
    points: [
      "Kết hợp PubMed, ClinicalTrials.gov, WHO ICD-11 và nguồn nội bộ.",
      "Hiển thị citation để đội chuyên môn kiểm tra nhanh.",
      "Giảm nhiễu bằng reranking theo ngữ cảnh ca bệnh."
    ],
    outcome: "Giảm thời gian tìm chứng cứ và tăng độ nhất quán tài liệu.",
  },
  {
    index: "03",
    title: "Vận hành có guardrail",
    subtitle: "KIỂM CHỨNG, CẢNH BÁO, GHI VẾT",
    points: [
      "Chặn câu trả lời thiếu ngữ cảnh bằng fallback policy.",
      "Bật lớp cảnh báo DDI với mức độ ưu tiên dễ hành động.",
      "Lưu audit trail để hỗ trợ review nội bộ."
    ],
    outcome: "Giảm rủi ro vận hành khi đưa AI vào ca thật.",
  },
  {
    index: "04",
    title: "Đo lường và mở rộng",
    subtitle: "MỞ RỘNG DỰA TRÊN SỐ LIỆU",
    points: [
      "Theo dõi KPI theo tuần thay vì cảm nhận chủ quan.",
      "Chỉ mở rộng module khi use-case đầu đạt ngưỡng đã chốt.",
      "Quản trị thay đổi tập trung qua Control Tower."
    ],
    outcome: "Tăng khả năng chuyển từ pilot sang vận hành dài hạn.",
  },
] as const satisfies readonly WorkflowStep[];

export const MODULE_CARDS = [
  {
    tag: "CLARA RESEARCH",
    title: "Truy xuất bằng chứng y khoa đa nguồn",
    description: "Tổng hợp câu trả lời có citation để đội chuyên môn kiểm tra và tái sử dụng nhanh hơn.",
    bullets: [
      "Evidence panel có truy vết PMID/DOI.",
      "Reranking theo bối cảnh truy vấn.",
      "Phù hợp bác sĩ trẻ, sinh viên y, nhóm nghiên cứu."
    ],
    cta: "Mở CLARA Research",
    href: "/research",
  },
  {
    tag: "CLARA COUNCIL",
    title: "Hội chẩn AI đa chuyên khoa theo wizard",
    description: "Chuẩn hóa luồng intake, review và tổng hợp để giảm phụ thuộc vào ghi chú rời rạc.",
    bullets: [
      "Wizard nhiều bước theo đúng ngữ cảnh ca.",
      "Tách workspace theo chức năng để dễ đối chiếu.",
      "Nêu rõ điểm đồng thuận và điểm cần escalation."
    ],
    cta: "Mở Hội chẩn AI",
    href: "/council/new",
  },
  {
    tag: "CLARA SELF-MED",
    title: "An toàn dùng thuốc tại nhà",
    description: "Số hóa tủ thuốc cá nhân, kiểm tra tương tác và nhắc lịch dùng theo hồ sơ người bệnh.",
    bullets: [
      "Nhận diện thuốc từ ảnh/OCR.",
      "Nhắc liều theo thời điểm thiết lập.",
      "Giảm nhầm lẫn do trùng hoạt chất."
    ],
    cta: "Mở CLARA Self-Med",
    href: "/selfmed",
  },
  {
    tag: "CLARA CAREGUARD",
    title: "DDI guardrail cho quyết định thuốc",
    description: "Kiểm tra tương tác, dị ứng và điểm cảnh báo trước khi hoàn tất khuyến nghị điều trị.",
    bullets: [
      "Phân mức cảnh báo để ưu tiên xử lý.",
      "Hỗ trợ ngữ cảnh ngoại trú và theo dõi tại nhà.",
      "Dễ đưa vào checklist của đội điều trị."
    ],
    cta: "Mở CareGuard",
    href: "/careguard",
  },
  {
    tag: "CLARA SCRIBE",
    title: "Medical Scribe cho ghi chép lâm sàng",
    description: "Chuẩn hóa ghi chú khám bệnh để đội ngũ giảm tải nhập liệu hành chính sau ca.",
    bullets: [
      "Sinh bản ghi theo mẫu thống nhất.",
      "Dễ kiểm tra lại lịch sử xử lý.",
      "Hỗ trợ bàn giao ca trực mạch lạc hơn."
    ],
    cta: "Mở Medical Scribe",
    href: "/scribe",
  },
  {
    tag: "CLARA CONTROL TOWER",
    title: "Quản trị Answer Flow và tri thức tập trung",
    description: "Theo dõi runtime, cấu hình nguồn tri thức và quản trị policy trong một không gian vận hành.",
    bullets: [
      "Quan sát flow, ngưỡng và trạng thái hệ thống.",
      "Quản lý knowledge source theo từng nghiệp vụ.",
      "Hỗ trợ kiểm toán nội bộ khi mở rộng."
    ],
    cta: "Mở Control Tower",
    href: "/admin/overview",
  },
] as const satisfies readonly ModuleCard[];

export const ROI_METRICS = [
  {
    label: "Thời gian tổng hợp tài liệu cho 1 ca",
    target: "Mục tiêu giảm 20-30% trong pilot",
    note: "Đo theo baseline trước triển khai và review theo tuần.",
  },
  {
    label: "Thời gian chuẩn bị trước hội chẩn",
    target: "Mục tiêu giảm 15-25%",
    note: "Phù hợp nhóm đã có quy trình hội chẩn định kỳ.",
  },
  {
    label: "Tỷ lệ ca có citation kiểm chứng",
    target: "Mục tiêu đạt trên 90%",
    note: "Chỉ tính ca có yêu cầu trích dẫn nguồn trong quy trình.",
  },
  {
    label: "Tỷ lệ checklist an toàn thuốc được hoàn tất",
    target: "Mục tiêu đạt trên 95%",
    note: "Áp dụng cho các ca bật guardrail DDI đầy đủ.",
  },
] as const satisfies readonly RoiMetric[];

export const SAFETY_GUARDRAILS = [
  {
    title: "Citation-first response",
    description: "Ưu tiên phản hồi kèm nguồn, giảm câu trả lời thiếu căn cứ kiểm chứng.",
  },
  {
    title: "DDI cảnh báo nhiều mức",
    description: "Phân tầng mức độ tương tác để đội xử lý theo ưu tiên lâm sàng.",
  },
  {
    title: "Policy gate theo ngữ cảnh",
    description: "Chặn hoặc hạ mức tự động khi thiếu dữ liệu quan trọng.",
  },
  {
    title: "Role-based access control",
    description: "Giới hạn quyền truy cập theo vai trò: người dùng, bác sĩ, nghiên cứu, quản trị.",
  },
  {
    title: "De-identification cho dữ liệu nhạy cảm",
    description: "Ẩn danh thông tin PII/PHI trước khi đưa vào xử lý mở rộng.",
  },
  {
    title: "Audit trail phục vụ kiểm toán",
    description: "Lưu vết quyết định và thao tác để phục vụ review nội bộ.",
  },
] as const satisfies readonly SafetyGuardrail[];

export const INTEGRATIONS = [
  {
    name: "PubMed",
    category: "Evidence",
    description: "Nguồn bài báo y sinh học cho truy vấn tổng hợp bằng chứng.",
  },
  {
    name: "ClinicalTrials.gov",
    category: "Evidence",
    description: "Đối chiếu thử nghiệm lâm sàng liên quan theo từng chủ đề.",
  },
  {
    name: "WHO ICD-11",
    category: "Terminology",
    description: "Chuẩn hóa mã bệnh và diễn giải theo ngữ cảnh quốc tế.",
  },
  {
    name: "openFDA",
    category: "Drug Safety",
    description: "Tham chiếu tín hiệu an toàn thuốc và dữ liệu cảnh báo mở.",
  },
  {
    name: "Dược thư VN",
    category: "Local Guideline",
    description: "Bổ sung bối cảnh sử dụng thuốc phù hợp thực hành tại Việt Nam.",
  },
  {
    name: "Bộ Y tế",
    category: "Local Guideline",
    description: "Liên kết với danh mục và văn bản chuyên môn đã công bố.",
  },
  {
    name: "DI & ADR",
    category: "Drug Safety",
    description: "Hỗ trợ rà soát thông tin tương tác và phản ứng có hại của thuốc.",
  },
  {
    name: "RxNorm",
    category: "Terminology",
    description: "Chuẩn hóa tên thuốc và hoạt chất cho bài toán mapping dữ liệu.",
  },
] as const satisfies readonly Integration[];

export const TESTIMONIALS = [
  {
    name: "Lê Minh Anh",
    role: "Người chăm sóc tại nhà",
    channel: "Hà Nội",
    quote: "Mình nhìn thấy cảnh báo tương tác rõ ràng hơn, đỡ phải tra nhiều nguồn như trước.",
  },
  {
    name: "Trần Đức Phúc",
    role: "Sinh viên Y6",
    channel: "TP.HCM",
    quote: "Phần citation giúp mình kiểm tra nguồn nhanh khi chuẩn bị seminar và thảo luận ca.",
  },
  {
    name: "BS. Nguyễn Hoài Nam",
    role: "Bác sĩ Nội tổng quát",
    channel: "Huế",
    quote: "Hữu ích ở chỗ nhắc rõ mức tin cậy và giới hạn, nên dễ dùng như lớp hỗ trợ tra cứu.",
  },
  {
    name: "Phạm Thảo Vy",
    role: "Bệnh nhân tăng huyết áp",
    channel: "Đà Nẵng",
    quote: "Nhắc lịch dùng thuốc đều hơn và quản lý thuốc trong nhà có hệ thống hơn.",
  },
  {
    name: "Dương Quốc Bảo",
    role: "Research Assistant",
    channel: "Cần Thơ",
    quote: "Tổng hợp y văn nhanh hơn khi cần đối chiếu nhiều guideline trong một phiên làm việc.",
  },
  {
    name: "Ngô Hạnh Sương",
    role: "Điều dưỡng",
    channel: "Gia Lâm",
    quote: "Scribe giúp ghi chú sau ca gọn hơn, giảm áp lực nhập liệu thủ công.",
  },
] as const satisfies readonly Testimonial[];

export const SPONSORS = [
  {
    name: "HiTechCloud",
    href: "https://hitechcloud.vn",
    logo: "https://hitechcloud.vn/wp-content/uploads/2025/01/hitechcloudvn.svg",
  },
  {
    name: "BNIX",
    href: "https://bnix.vn",
    logo: "https://bnix.vn/wp-content/uploads/2023/05/bnix-logo.png",
  },
] as const satisfies readonly Sponsor[];

export const OFFICES = [
  {
    city: "HÀ NỘI (VN)",
    detail: "Toà P3 Pavilion, Vinhomes Ocean Park 1, Gia Lâm, HN",
  },
  {
    city: "HÀ NỘI (VN)",
    detail: "Toà S2.18, phân khu Sapphire, Vinhomes Ocean Park 1, quận Gia Lâm, TP Hà Nội",
  },
  {
    city: "HÀ NỘI (VN)",
    detail: "Toà E5, Khu đô thị Ciputra, Phú Thượng, Hà Nội",
  },
  {
    city: "HUẾ (VN)",
    detail: "Toà CT3, Chung cư Aranya, đường Dương Khuê, TP Huế",
  },
  {
    city: "EMAIL",
    detail: "clara@thiennn.icu",
  },
  {
    city: "HOTLINE",
    detail: "0853374247",
  },
] as const satisfies readonly Office[];

export const FAQ_ITEMS = [
  {
    question: "CLARA có thay thế bác sĩ trong chẩn đoán hoặc kê đơn không?",
    answer:
      "Không. CLARA là hệ thống hỗ trợ quyết định dựa trên dữ liệu và bằng chứng. Quyết định lâm sàng cuối cùng vẫn thuộc về bác sĩ và cơ sở y tế.",
  },
  {
    question: "Vì sao dataset này gọi là conversion-first?",
    answer:
      "Vì nội dung được sắp theo hành trình chuyển đổi: nêu vấn đề, mô tả workflow, làm rõ ROI, chứng minh guardrail và kết bằng CTA hành động.",
  },
  {
    question: "ROI trên landing có phải cam kết tuyệt đối không?",
    answer:
      "Không. Các chỉ số ROI là mục tiêu pilot thường dùng để tham chiếu. Kết quả thực tế phụ thuộc baseline, dữ liệu và mức tuân thủ quy trình của từng đơn vị.",
  },
  {
    question: "CLARA xử lý an toàn thuốc như thế nào?",
    answer:
      "Hệ thống duy trì hồ sơ thuốc, đối chiếu tương tác bất lợi và hiển thị cảnh báo theo mức độ ưu tiên để đội chuyên môn review trước khi chốt quyết định.",
  },
  {
    question: "Dữ liệu sức khỏe có được bảo vệ không?",
    answer:
      "Có. Hệ thống áp dụng phân quyền theo vai trò, ẩn danh dữ liệu nhạy cảm theo ngữ cảnh và lưu audit log để phục vụ kiểm tra nội bộ.",
  },
  {
    question: "Nên bắt đầu triển khai từ module nào?",
    answer:
      "Nên bắt đầu từ một use-case có thể đo rõ trong 2-8 tuần, ví dụ Research hoặc Council, sau đó mới mở rộng thêm module khác khi KPI đạt ngưỡng đã chốt.",
  },
] as const satisfies readonly FaqItem[];

export const FINAL_CTA = {
  heading: "SẴN SÀNG CHUYỂN TỪ DEMO AI SANG WORKFLOW Y TẾ CÓ KPI?",
  subheading:
    "Bắt đầu từ một use-case đo được, chạy pilot ngắn hạn và review theo tuần. Khi dữ liệu ổn định, mở rộng thêm module mà không phải xây lại từ đầu.",
  button: "ĐĂNG KÝ PILOT CÙNG CLARA",
  href: "/register",
  secondaryButton: "XEM DEMO FLOW",
  secondaryHref: "/research",
} as const satisfies FinalCta;

export const CLARA_KP3_CONVERSION_DATA = {
  heroMetrics: HERO_METRICS,
  problemPoints: PROBLEM_POINTS,
  workflowSteps: WORKFLOW_STEPS,
  moduleCards: MODULE_CARDS,
  roiMetrics: ROI_METRICS,
  safetyGuardrails: SAFETY_GUARDRAILS,
  integrations: INTEGRATIONS,
  testimonials: TESTIMONIALS,
  sponsors: SPONSORS,
  offices: OFFICES,
  faq: FAQ_ITEMS,
  finalCta: FINAL_CTA,
} as const;

// Backward-compat aliases trong giai đoạn chuyển giao landing cũ -> mới.
export type ServiceCard = ModuleCard;
export type ModelStep = WorkflowStep;
export const SERVICE_CARDS: readonly ServiceCard[] = MODULE_CARDS;
export const MODEL_STEPS: readonly ModelStep[] = WORKFLOW_STEPS;
export const OPEN_LETTER_PARAGRAPHS: readonly string[] = PROBLEM_POINTS.map(
  (item) => `${item.title}: ${item.description} ${item.consequence}`,
);
export const PARTNER_STRIP: readonly string[] = INTEGRATIONS.map((item) => item.name);
