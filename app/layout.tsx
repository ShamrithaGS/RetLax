import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Retirement Planning Calculator | HDFC Mutual Fund — Investor Education',
  description:
    'An illustrative retirement planning calculator by HDFC Mutual Fund. Estimate how much corpus you need and your required monthly SIP. For investor education purposes only. Not a recommendation.',
  keywords: 'retirement calculator, SIP calculator, HDFC Mutual Fund, retirement corpus, investor education, financial planning India',
  manifest: '/manifest.json',
  themeColor: '#224c87',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#224c87" />
        <link rel="manifest" href="/manifest.json" />
        <script dangerouslySetInnerHTML={{
          __html: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js'); }); }`
        }} />
      </head>
      <body>
        {}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
