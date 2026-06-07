import type { Metadata } from "next";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LenisProvider } from "@/components/LenisProvider";
import { ShareCardShell } from "@/components/ShareCardShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "不高山",
  description: "高乐高的小站，展示微信读书的阅读记录",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const themeInitScript = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark")}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen font-body antialiased">
        <ThemeProvider>
          <LenisProvider>
            <ShareCardShell>
              <div className="page-enter page-shell mx-auto flex min-h-screen w-full flex-col">
                <SiteHeader />
                <main className="min-w-0 flex-1">{children}</main>
                <SiteFooter />
              </div>
            </ShareCardShell>
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
