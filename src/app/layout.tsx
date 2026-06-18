import type { Metadata, Viewport } from 'next';
import './globals.css';
import TopBar from '@/components/TopBar';
import Footer from '@/components/Footer';
import MobileNav from '@/components/MobileNav';
import { AuthProvider } from '@/lib/auth';
import AuthGate from '@/components/AuthGate';

export const metadata: Metadata = {
  title: 'MoneyMochi — Friendly Finance Dashboard',
  description: 'Your friendly stock investment dashboard. Track prices, read AI analysis, set alerts, and stay current with market news. Educational tool — not financial advice.',
  keywords: ['stocks', 'finance', 'dashboard', 'investing', 'watchlist', 'market news'],
  authors: [{ name: 'MoneyMochi' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FBF6F0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <TopBar />
          <main className="flex-1 max-w-[1080px] mx-auto w-full px-4 sm:px-6 pt-25 pb-24 md:pb-12">
            <AuthGate>{children}</AuthGate>
          </main>
          <Footer />
          <MobileNav />
        </AuthProvider>
      </body>
    </html>
  );
}
