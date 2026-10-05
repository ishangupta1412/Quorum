import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Quorum — Campaign-Correlation Detection',
  description: 'Bipartite graph clustering engine that catches distributed password sprays missed by traditional SIEM threshold rules.',
  keywords: 'NOBELIUM, password spray, bipartite graph, SIEM, threat detection, Microsoft Sentinel',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="antialiased"
        style={{
          background: '#000',
          color: '#CBD5E1',
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
