import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import { AuthProvider } from '@/contexts/auth-context';
import { ThemeProvider } from '@/contexts/theme-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'AquaFlow | Industrial IoT Monitoring Platform',
  description:
    'Real-time monitoring and analytics platform for water and chemical treatment facilities',
  keywords: [
    'IoT',
    'water treatment',
    'industrial monitoring',
    'SCADA',
    'sensor analytics',
    'real-time monitoring',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
