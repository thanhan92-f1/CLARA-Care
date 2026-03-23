import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto mt-24 max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-2 text-3xl font-bold">CLARA P0</h1>
      <p className="mb-6 text-slate-600">Chọn vai trò và bắt đầu workflow.</p>
      <div className="space-y-2">
        <Link className="block rounded bg-primary px-4 py-2 text-center text-white" href="/login">
          Đăng nhập
        </Link>
        <Link className="block rounded border px-4 py-2 text-center" href="/register">
          Đăng ký
        </Link>
      </div>
    </main>
  );
}
