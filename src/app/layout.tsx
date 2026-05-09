import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";

export const metadata: Metadata = {
  title: "Wed Plan — Wedding Budget Tracker",
  description: "Track your wedding costs, compare vendors, and manage your budget",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wed Plan",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#8b6f4e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => {
              try {
                const saved = localStorage.getItem('theme');
                if (saved === 'dark' || saved === 'light') {
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(saved);
                }
              } catch {}
            })();`,
          }}
        />
        <main className="pb-20 min-h-dvh">
          {children}
        </main>
        <BottomNav />
      </body>
    </html>
  );
}
