import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import HeaderNavClient from "@/components/HeaderNavClient";
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
  title: "TalkToMe",
  description: "AI meeting notes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div style={{ minHeight: '100vh', display: 'grid', gridTemplateRows: 'auto 1fr auto' }}>
          <header className="glass safe-header" style={{ margin: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 12 }}>
            <div style={{ fontWeight: 700 }}>🎤 TalkToMe</div>
            <HeaderNavClient />
          </header>
          <main className="container" style={{ paddingTop: 8, paddingBottom: 8 }}>{children}</main>
          <footer className="glass" style={{ margin: '12px', padding: '10px 16px', fontSize: 12, borderRadius: 12 }}>
            <span>© {new Date().getFullYear()} TalkToMe</span>
          </footer>
        </div>
      </body>
    </html>
  );
}
