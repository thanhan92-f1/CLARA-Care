"use client";

import { useMemo } from "react";
import type { ControlTowerRagFlow } from "@/lib/system";

export type FlowToggleKey = Exclude<keyof ControlTowerRagFlow, "low_context_threshold">;

export type FlowNodeId =
  | "input_gateway"
  | "safety_ingress"
  | "role_router"
  | "intent_router"
  | "planner"
  | "retrieval_scientific"
  | "retrieval_web"
  | "retrieval_file"
  | "synthesis"
  | "verification"
  | "policy_gate"
  | "responder"
  | "deepseek_fallback";

type FlowNodeStatus = "required" | "on" | "off";

type FlowNodeDef = {
  id: FlowNodeId;
  title: string;
  subtitle: string;
  description: string;
  riskNote: string;
  x: number;
  y: number;
  toggleKey?: FlowToggleKey;
};

export type FlowNodeInfo = Pick<FlowNodeDef, "id" | "title" | "subtitle" | "description" | "riskNote" | "toggleKey">;

type FlowEdgeDef = {
  from: FlowNodeId;
  to: FlowNodeId;
  bend?: number;
  fallback?: boolean;
  label?: string;
};

type AdminFlowVisualizerProps = {
  ragFlow?: ControlTowerRagFlow | null;
  onToggle: (key: FlowToggleKey) => void;
  onSelectNode: (nodeId: FlowNodeId) => void;
  selectedNodeId?: FlowNodeId | null;
};

const SCENE_WIDTH = 1240;
const SCENE_HEIGHT = 760;

const NODES: FlowNodeDef[] = [
  {
    id: "input_gateway",
    title: "Input Gateway",
    subtitle: "Nhận truy vấn từ web/app",
    description: "Điểm vào của luồng xử lý, gắn trace id và chuẩn hóa payload ban đầu.",
    riskNote: "Nếu payload thiếu chuẩn, toàn bộ pipeline phía sau sẽ khó kiểm soát chất lượng.",
    x: 80,
    y: 360
  },
  {
    id: "safety_ingress",
    title: "Safety Ingress",
    subtitle: "PII/PHI + kiểm soát an toàn",
    description: "Lọc dữ liệu nhạy cảm, kiểm điều kiện an toàn trước khi phân loại luồng.",
    riskNote: "Bỏ qua bước này có thể rò rỉ dữ liệu cá nhân và tăng rủi ro tuân thủ.",
    x: 245,
    y: 360
  },
  {
    id: "role_router",
    title: "Role Router (B1)",
    subtitle: "Phân loại theo vai trò",
    description: "Xác định role: normal/researcher/doctor/admin để chọn chiến lược kế tiếp.",
    riskNote: "Sai role sẽ kéo theo chọn sai policy và sai chất lượng kết quả.",
    x: 400,
    y: 245,
    toggleKey: "role_router_enabled"
  },
  {
    id: "intent_router",
    title: "Intent Router (B2)",
    subtitle: "Phân loại ý định theo role",
    description: "Tách intent để route đúng graph xử lý: quick/deep/case-review/...",
    riskNote: "Sai intent thường gây retrieval lệch nguồn và trả lời không trúng trọng tâm.",
    x: 400,
    y: 475,
    toggleKey: "intent_router_enabled"
  },
  {
    id: "planner",
    title: "Planner",
    subtitle: "Lập kế hoạch thực thi",
    description: "Chọn thứ tự các node retrieve/verify/fallback và ngân sách xử lý.",
    riskNote: "Planner yếu sẽ làm tăng độ trễ hoặc truy xuất nguồn không cần thiết.",
    x: 560,
    y: 360
  },
  {
    id: "retrieval_scientific",
    title: "Retrieval Scientific",
    subtitle: "PubMed / Europe PMC",
    description: "Truy xuất nguồn khoa học chính thống cho câu hỏi cần bằng chứng mạnh.",
    riskNote: "Tắt node này làm giảm chất lượng citation cho câu hỏi chuyên sâu.",
    x: 740,
    y: 215,
    toggleKey: "scientific_retrieval_enabled"
  },
  {
    id: "retrieval_web",
    title: "Retrieval Web",
    subtitle: "Nguồn web uy tín",
    description: "Bổ sung dữ liệu mới từ web đã cấu hình trust/crawling policy.",
    riskNote: "Nếu trust score yếu, node này có thể bơm nhiễu vào synthesis.",
    x: 740,
    y: 360,
    toggleKey: "web_retrieval_enabled"
  },
  {
    id: "retrieval_file",
    title: "Retrieval File",
    subtitle: "Tài liệu người dùng tải lên",
    description: "Dùng nội dung từ uploaded files / knowledge source để grounded trả lời.",
    riskNote: "Tắt node này có thể bỏ sót ngữ cảnh quan trọng của phiên nghiên cứu.",
    x: 740,
    y: 505,
    toggleKey: "file_retrieval_enabled"
  },
  {
    id: "synthesis",
    title: "Synthesis",
    subtitle: "Tổng hợp phản hồi nháp",
    description: "Gộp bằng chứng từ nhiều retriever và tạo draft answer + claims.",
    riskNote: "Nếu không ràng buộc claim/citation rõ, nguy cơ hallucination tăng cao.",
    x: 910,
    y: 360
  },
  {
    id: "verification",
    title: "Verification",
    subtitle: "Kiểm chứng FIDES",
    description: "Thẩm định claim và mức hỗ trợ từ evidence trước khi qua policy gate.",
    riskNote: "Tắt verification làm mất lớp guardrail quan trọng của CLARA Research.",
    x: 1050,
    y: 280,
    toggleKey: "verification_enabled"
  },
  {
    id: "policy_gate",
    title: "Policy Gate",
    subtitle: "Quyết định allow/warn/block/escalate",
    description: "Áp luật an toàn hệ thống để chặn/giảm thiểu phản hồi rủi ro cao.",
    riskNote: "Thiếu policy gate sẽ không phân tách được phản hồi an toàn và phản hồi nguy cơ.",
    x: 1050,
    y: 440
  },
  {
    id: "responder",
    title: "Responder",
    subtitle: "Trả phản hồi cuối",
    description: "Xuất output cuối cùng cùng citation/metadata về UI và log runtime.",
    riskNote: "Nếu metadata thiếu, người dùng khó đánh giá độ tin cậy của câu trả lời.",
    x: 1170,
    y: 360
  },
  {
    id: "deepseek_fallback",
    title: "DeepSeek Fallback",
    subtitle: "Nhánh fallback low-context",
    description: "Khi context kém chất lượng, dùng fallback để giữ tính liên tục dịch vụ.",
    riskNote: "Lạm dụng fallback có thể làm câu trả lời ít grounded hơn RAG path.",
    x: 910,
    y: 640,
    toggleKey: "deepseek_fallback_enabled"
  }
];

export const FLOW_NODE_INFOS: Record<FlowNodeId, FlowNodeInfo> = NODES.reduce(
  (acc, node) => {
    acc[node.id] = {
      id: node.id,
      title: node.title,
      subtitle: node.subtitle,
      description: node.description,
      riskNote: node.riskNote,
      toggleKey: node.toggleKey
    };
    return acc;
  },
  {} as Record<FlowNodeId, FlowNodeInfo>
);

const NODE_BY_ID = NODES.reduce<Record<FlowNodeId, FlowNodeDef>>((acc, node) => {
  acc[node.id] = node;
  return acc;
}, {} as Record<FlowNodeId, FlowNodeDef>);

const EDGES: FlowEdgeDef[] = [
  { from: "input_gateway", to: "safety_ingress" },
  { from: "safety_ingress", to: "role_router", bend: -25 },
  { from: "safety_ingress", to: "intent_router", bend: 25 },
  { from: "role_router", to: "planner", bend: 22 },
  { from: "intent_router", to: "planner", bend: -22 },
  { from: "planner", to: "retrieval_scientific", bend: -18 },
  { from: "planner", to: "retrieval_web" },
  { from: "planner", to: "retrieval_file", bend: 18 },
  { from: "retrieval_scientific", to: "synthesis", bend: 18 },
  { from: "retrieval_web", to: "synthesis" },
  { from: "retrieval_file", to: "synthesis", bend: -18 },
  { from: "synthesis", to: "verification", bend: -18 },
  { from: "synthesis", to: "policy_gate", bend: 18 },
  { from: "verification", to: "responder", bend: 20 },
  { from: "policy_gate", to: "responder", bend: -20 },
  { from: "planner", to: "deepseek_fallback", bend: 42, fallback: true, label: "low-context fallback" },
  { from: "synthesis", to: "deepseek_fallback", bend: 38, fallback: true },
  { from: "deepseek_fallback", to: "responder", bend: -40, fallback: true, label: "fallback response" }
];

const STATUS_META: Record<
  FlowNodeStatus,
  {
    label: string;
    badgeClass: string;
    nodeClass: string;
  }
> = {
  required: {
    label: "required",
    badgeClass: "border-sky-300 bg-sky-100 text-sky-700",
    nodeClass: "border-sky-300/80 bg-white/95"
  },
  on: {
    label: "on",
    badgeClass: "border-emerald-300 bg-emerald-100 text-emerald-700",
    nodeClass: "border-emerald-300/80 bg-white/95"
  },
  off: {
    label: "off",
    badgeClass: "border-slate-300 bg-slate-100 text-slate-600",
    nodeClass: "border-slate-300/80 bg-slate-50/95"
  }
};

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

function buildPath(from: FlowNodeDef, to: FlowNodeDef, bend = 0): string {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2 + bend;
  return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}

function isActive(status: FlowNodeStatus): boolean {
  return status === "required" || status === "on";
}

function resolveNodeStatus(node: FlowNodeDef, ragFlow?: ControlTowerRagFlow | null): FlowNodeStatus {
  if (!node.toggleKey) return "required";
  return ragFlow?.[node.toggleKey] ? "on" : "off";
}

export default function AdminFlowVisualizer({
  ragFlow,
  onToggle,
  onSelectNode,
  selectedNodeId
}: AdminFlowVisualizerProps) {
  const statusByNode = useMemo(() => {
    return NODES.reduce<Record<FlowNodeId, FlowNodeStatus>>((acc, node) => {
      acc[node.id] = resolveNodeStatus(node, ragFlow);
      return acc;
    }, {} as Record<FlowNodeId, FlowNodeStatus>);
  }, [ragFlow]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Flow Canvas</p>
          <h3 className="mt-1 text-sm font-semibold text-slate-900">CLARA Dify-lite Visualizer</h3>
          <p className="mt-1 text-xs text-slate-600">Click node để inspect, node có cờ sẽ toggle trực tiếp ngay trên canvas.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="rounded-full border border-sky-300 bg-sky-100 px-2 py-1 font-semibold text-sky-700">required</span>
          <span className="rounded-full border border-emerald-300 bg-emerald-100 px-2 py-1 font-semibold text-emerald-700">on</span>
          <span className="rounded-full border border-slate-300 bg-slate-100 px-2 py-1 font-semibold text-slate-600">off</span>
          <span className="rounded-full border border-orange-300 bg-orange-100 px-2 py-1 font-semibold text-orange-700">fallback branch</span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50">
        <div
          className="relative"
          style={{
            width: SCENE_WIDTH,
            height: SCENE_HEIGHT,
            backgroundImage:
              "linear-gradient(to right, rgba(148,163,184,0.16) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.16) 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        >
          <svg
            className="pointer-events-none absolute inset-0"
            width={SCENE_WIDTH}
            height={SCENE_HEIGHT}
            viewBox={`0 0 ${SCENE_WIDTH} ${SCENE_HEIGHT}`}
          >
            <defs>
              <marker id="flow-arrow-on" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="#0284c7" />
              </marker>
              <marker id="flow-arrow-off" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="#94a3b8" />
              </marker>
              <marker id="flow-arrow-fallback" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                <path d="M0,0 L8,4 L0,8 z" fill="#ea580c" />
              </marker>
            </defs>

            {EDGES.map((edge) => {
              const from = NODE_BY_ID[edge.from];
              const to = NODE_BY_ID[edge.to];
              const fromStatus = statusByNode[edge.from];
              const toStatus = statusByNode[edge.to];
              const edgeActive = isActive(fromStatus) && isActive(toStatus);
              const fallbackEnabled = edge.fallback ? Boolean(ragFlow?.deepseek_fallback_enabled) : false;
              const path = buildPath(from, to, edge.bend);

              const stroke = edge.fallback
                ? fallbackEnabled
                  ? "#ea580c"
                  : "#cbd5e1"
                : edgeActive
                  ? "#0284c7"
                  : "#94a3b8";
              const marker = edge.fallback
                ? fallbackEnabled
                  ? "url(#flow-arrow-fallback)"
                  : "url(#flow-arrow-off)"
                : edgeActive
                  ? "url(#flow-arrow-on)"
                  : "url(#flow-arrow-off)";

              const labelX = (from.x + to.x) / 2;
              const labelY = (from.y + to.y) / 2 + (edge.bend ?? 0) - 10;

              return (
                <g key={`${edge.from}-${edge.to}`}>
                  <path
                    d={path}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={edge.fallback ? 2.5 : 2}
                    strokeDasharray={edge.fallback ? "8 6" : undefined}
                    markerEnd={marker}
                  />
                  {edge.label ? (
                    <text x={labelX} y={labelY} textAnchor="middle" className="fill-slate-600 text-[11px] font-semibold">
                      {edge.label}
                    </text>
                  ) : null}
                </g>
              );
            })}
          </svg>

          {NODES.map((node) => {
            const status = statusByNode[node.id];
            const meta = STATUS_META[status];
            const isSelected = selectedNodeId === node.id;
            const isEnabled = status !== "off";
            const toggleKey = node.toggleKey;

            return (
              <div
                key={node.id}
                className="absolute"
                style={{
                  left: node.x,
                  top: node.y,
                  transform: "translate(-50%, -50%)"
                }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectNode(node.id)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectNode(node.id);
                    }
                  }}
                  className={cx(
                    "w-[168px] cursor-pointer rounded-xl border px-3 py-2 text-left shadow-sm transition",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                    meta.nodeClass,
                    isEnabled ? "hover:shadow-md" : "opacity-85",
                    isSelected && "border-indigo-400 ring-2 ring-indigo-300/70"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-900">{node.title}</p>
                    <span
                      className={cx("rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase", meta.badgeClass)}
                    >
                      {meta.label}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] leading-4 text-slate-600">{node.subtitle}</p>

                  {toggleKey ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        onToggle(toggleKey);
                      }}
                      className={cx(
                        "mt-2 inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500",
                        status === "on"
                          ? "border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          : "border-slate-300 bg-slate-100 text-slate-600 hover:bg-slate-200"
                      )}
                      aria-label={`Toggle ${node.title}`}
                    >
                      {status === "on" ? "Turn Off" : "Turn On"}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
