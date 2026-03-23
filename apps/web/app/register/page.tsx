export default function RegisterPage() {
  return (
    <main className="mx-auto mt-20 max-w-lg rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-2xl font-semibold">Đăng ký</h1>
      <div className="space-y-3">
        <input className="w-full rounded border p-2" placeholder="Họ và tên" />
        <input className="w-full rounded border p-2" placeholder="Email" />
        <input className="w-full rounded border p-2" type="password" placeholder="Mật khẩu" />
        <button className="w-full rounded bg-primary px-4 py-2 text-white">Tạo tài khoản</button>
      </div>
    </main>
  );
}
