import AdminObservabilityPanel from "@/components/admin/admin-observability-panel";
import AdminShell from "@/components/admin/admin-shell";

export default function AdminObservabilityPage() {
  return (
    <AdminShell
      activeTab="observability"
      title="Observability"
      description="Theo dõi health, dependency, latency và flow gates bằng signal board nội bộ (grafana-like) trong admin."
    >
      <AdminObservabilityPanel />
    </AdminShell>
  );
}
