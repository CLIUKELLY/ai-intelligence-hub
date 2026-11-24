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
  title: '有数儿 Noted｜AI 的事，心里有数。',
  description:
    '按你的关注方向研究、筛选和解释全球与中国 AI 新闻，用已有的 GPT 与 GitHub 轻量运行。',
  openGraph: {
    title: '有数儿 Noted｜AI 的事，心里有数。',
    description: 'AI 的事，心里有数。Your daily read on AI.',
    type: 'website',
    images: [{ url: '/ai-intelligence-hub/og.png', width: 1734, height: 907, alt: 'AI Intelligence Hub' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '有数儿 Noted｜AI 的事，心里有数。',
    description: 'AI 的事，心里有数。Your daily read on AI.',
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
