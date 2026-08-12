import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RetLax | Professional Retirement Planning Calculator',
  description:
    'An illustrative professional retirement planning calculator. Estimate how much corpus you need and your required monthly SIP with inflation, linear asset allocation glide path, and withdrawal tax calculations.',
  keywords: 'retirement calculator, SIP calculator, linear glide path, retirement corpus, asset allocation, withdrawal tax, financial planning',
  manifest: '/manifest.json',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
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
