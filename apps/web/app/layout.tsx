import "@/styles/globals.css";
import AppShell from "@/components/app-shell";

export const metadata = {
  title: "CLARA Web",
  description: "CLARA P0 web interface"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
