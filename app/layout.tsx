import type { Metadata } from 'next';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';

export const metadata: Metadata = {
  title: '歯科AI模擬患者シミュレーター',
  description: '歯科医師向けのAI模擬患者トレーニングシステム',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
