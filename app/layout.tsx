import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI Market Pulse — 中文 AI 市场情报中心',
  description:
    '为中文读者聚合全球与中国 AI 新闻，提供事件去重、影响力排序、来源交叉验证和每日重点摘要。',
  openGraph: {
    title: 'AI Market Pulse — 中文 AI 市场情报中心',
    description: '全球与中国 AI 新闻、趋势和市场信号，一屏掌握。',
    type: 'website',
    images: [{ url: '/og.png', width: 1734, height: 907, alt: 'AI Intelligence Hub' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Market Pulse — 中文 AI 市场情报中心',
    description: '全球与中国 AI 新闻、趋势和市场信号，一屏掌握。',
    images: ['/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
