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

/** Webfonts off the critical path — system fonts paint first, classes swap stacks when loaded. */
const fontLoadScript = `(function(){var f=[["https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/lxgwwenkai-regular.css","fonts-lxgw"],["https://cdn.jsdelivr.net/npm/@fontsource/noto-serif-sc@5.2.5/chinese-simplified-400.css","fonts-noto"]];for(var i=0;i<f.length;i++){(function(p){var l=document.createElement("link");l.rel="stylesheet";l.href=p[0];l.onload=function(){document.documentElement.classList.add(p[1])};document.head.appendChild(l)})(f[i])}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: fontLoadScript }} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-screen font-body antialiased">
        <ThemeProvider>
          <LenisProvider>
            <ShareCardShell>
              <div className="page-shell mx-auto flex min-h-screen w-full flex-col">
                <SiteHeader />
                <main className="page-enter min-w-0 flex-1">{children}</main>
                <SiteFooter />
              </div>
            </ShareCardShell>
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
