import "@/styles/globals.css";
import AppShell from "@/components/app-shell";
import { getThemeInitScript } from "@/lib/theme";

export const metadata = {
  title: "CLARA Web",
  description: "CLARA - trợ lý AI y tế cho hỏi đáp và quản lý thuốc an toàn"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
        <script id="theme-init" dangerouslySetInnerHTML={{ __html: getThemeInitScript() }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
