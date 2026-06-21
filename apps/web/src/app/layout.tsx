import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../components/ThemeProvider';
import { TopBar } from '../components/TopBar';
import { BottomNav } from '../components/BottomNav';

export const metadata: Metadata = {
  title: 'Finance App',
  description: 'Personal finance manager',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="bg-[var(--color-surface)] text-[var(--color-text)] antialiased">
        <ThemeProvider>
          <TopBar />
          <main className="pt-14 pb-16 min-h-screen">{children}</main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
