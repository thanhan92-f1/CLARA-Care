import AdminRagSourcesPanel from "@/components/admin/admin-rag-sources-panel";
import AdminShell from "@/components/admin/admin-shell";

export default function AdminRagSourcesPage() {
  return (
    <AdminShell
      activeTab="rag-sources"
      title="RAG Sources"
      description="Quản trị trạng thái nguồn dữ liệu: enabled, priority và category, sau đó lưu cấu hình tập trung."
    >
      <AdminRagSourcesPanel />
    </AdminShell>
  );
}
