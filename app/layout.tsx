import type { Metadata, Viewport } from "next";
import { Noto_Sans_JP, DM_Mono } from "next/font/google";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Salario | 中小企業向け給与計算システム",
  description: "中小企業のための給与計算・人件費管理SaaSプラットフォーム。勤怠管理、年末調整、社会保険手続きを一元管理。",
  keywords: ["給与計算", "人件費管理", "中小企業", "勤怠管理", "年末調整", "社会保険"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1a56db",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} ${dmMono.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
