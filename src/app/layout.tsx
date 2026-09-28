import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quorum — Detection Layer for VPN Authentication Telemetry',
  description: 'Enterprise Campaign-Correlation Engine for Microsoft Innovate 2026',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-base text-slate-200 antialiased selection:bg-rose-900 selection:text-white">
        {children}
      </body>
    </html>
  );
}
