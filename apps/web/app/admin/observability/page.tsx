import AdminObservabilityPanel from "@/components/admin/admin-observability-panel";
import AdminShell from "@/components/admin/admin-shell";

export default function AdminObservabilityPage() {
  return (
    <AdminShell
      activeTab="observability"
      title="Observability"
      description="Theo dõi health, dependency, latency và tín hiệu vận hành từ control tower runtime."
    >
      <AdminObservabilityPanel />
    </AdminShell>
  );
}
