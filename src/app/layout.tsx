import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Page Load Lab",
  description: "Page performance profiler: URL in, Core Web Vitals out, plus ranked “why slow?” opportunities.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-dvh bg-[radial-gradient(1200px_circle_at_20%_-10%,rgba(56,189,248,0.22),transparent_55%),radial-gradient(900px_circle_at_90%_10%,rgba(34,197,94,0.18),transparent_55%),linear-gradient(to_bottom,#0b0f1a,#070913_25%,#060815)] text-zinc-100">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-black/20 backdrop-blur">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
              <Link href="/" className="group inline-flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/15">
                  <span className="text-sm font-semibold tracking-tight">PL</span>
                </span>
                <span className="text-sm font-semibold tracking-tight text-white/90 group-hover:text-white">Page Load Lab</span>
              </Link>
              <div className="text-xs text-white/55">PSI v1 now, Playwright v2 next</div>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>
          <footer className="border-t border-white/10 bg-black/20">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-6 text-xs text-white/55 md:flex-row md:items-center md:justify-between">
              <div>
                Built for page-load diagnostics. Treat third-party data as approximate; verify with real-user data when possible.
              </div>
              <div className="font-mono">v0.1</div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
