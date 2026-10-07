import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { ThemeToggle } from "@/components/gallery/ThemeToggle";
import { siteConfig } from "@/lib/site";
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
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.ownerName} · ${siteConfig.title}`,
    template: `%s · ${siteConfig.title}`,
  },
  description: siteConfig.description,
};

// Runs before paint so the saved theme never flashes.
const themeScript = `(function(){try{var t=localStorage.getItem("theme");var d=t==="dark"||((!t||t==="system")&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-white font-sans text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <header className="sticky top-0 z-30 border-b border-zinc-200/80 bg-white/80 backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/80">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
            <Link
              href="/"
              className="rounded-md text-sm font-semibold tracking-tight outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              {siteConfig.ownerName}
              <span className="font-normal text-zinc-500 dark:text-zinc-400"> / {siteConfig.title}</span>
            </Link>
            <nav className="flex items-center gap-1" aria-label="Site">
              <a
                href={siteConfig.repoUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-md px-3 py-2 text-sm text-zinc-600 outline-none hover:text-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                GitHub
              </a>
              <ThemeToggle />
            </nav>
          </div>
        </header>
        <div className="flex-1">{children}</div>
        <footer className="border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-zinc-500 sm:px-6 dark:text-zinc-400">
            Built for the LofiStack 90 Day Build Challenge.
          </div>
        </footer>
      </body>
    </html>
  );
}
