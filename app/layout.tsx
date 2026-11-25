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
  title: 'There Goes AI Again | The latest moves. The useful bits.',
  description:
    '全球与中国 AI 最新动态：模型、产品、开发工具与基础设施，附具体变化、实际意义和原始来源。',
  openGraph: {
    title: '又整啥了｜There Goes AI Again',
    description: 'AI 新鲜事，每天都在整点新活。The latest moves. The useful bits.',
    type: 'website',
    images: [{ url: '/there-goes-ai-again/og.png', width: 1734, height: 907, alt: 'There Goes AI Again' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '又整啥了｜There Goes AI Again',
    description: 'AI 新鲜事，每天都在整点新活。The latest moves. The useful bits.',
    images: ['/there-goes-ai-again/og.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
