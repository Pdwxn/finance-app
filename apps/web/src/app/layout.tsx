import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ThemeProvider } from '../components/ThemeProvider';
import { AppShell } from '../components/AppShell';

export const metadata: Metadata = {
  title: {
    absolute: 'Numa',
  },
  description: 'Gestor de finanzas personales offline-first',
  applicationName: 'Numa',
  appleWebApp: {
    capable: true,
    title: 'Numa',
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    title: 'Numa',
    siteName: 'Numa',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Numa" />
      </head>
      <body className="bg-[var(--color-surface)] text-[var(--color-text)] antialiased">
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
