import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '../components/ThemeProvider';
import { AppShell } from '../components/AppShell';

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
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
