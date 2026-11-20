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
  metadataBase: new URL('https://cliukelly.github.io'),
  title: 'AI Intelligence Hub — Personalized AI Market Pulse',
  description:
    '按你的关注方向研究、筛选和解释全球与中国 AI 新闻，用已有的 GPT 与 GitHub 轻量运行。',
  openGraph: {
    title: 'AI Intelligence Hub — Personalized AI Market Pulse',
    description: '不是更多新闻，而是与你相关、可核验、能改变判断的 AI 信号。',
    type: 'website',
    images: [{ url: '/ai-intelligence-hub/og.png', width: 1734, height: 907, alt: 'AI Intelligence Hub' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Intelligence Hub — Personalized AI Market Pulse',
    description: '不是更多新闻，而是与你相关、可核验、能改变判断的 AI 信号。',
    images: ['/ai-intelligence-hub/og.png'],
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
