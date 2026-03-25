import AdminOverviewPanel from "@/components/admin/admin-overview-panel";
import AdminShell from "@/components/admin/admin-shell";

export default function AdminOverviewPage() {
  return (
    <AdminShell
      activeTab="overview"
      title="Admin Overview"
      description="Tổng quan điều phối cấu hình RAG và answer flow theo phong cách technical dashboard."
    >
      <AdminOverviewPanel />
    </AdminShell>
  );
}
