import '@rainbow-me/rainbowkit/styles.css';
import './globals.css';
import type { Metadata } from 'next';
import { Outfit, Plus_Jakarta_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { AppGate } from '@/components/app-gate';
import { Providers } from '@/components/providers';

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-plus-jakarta-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'BrickDAO — Tokenized Real Estate',
  description:
    'BrickDAO — Tokenized real estate on-chain. Own fractions of premium properties, earn returns, and build wealth brick by brick.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${plusJakartaSans.variable} h-full`}>
      <body className="min-h-full flex flex-col">
        <Providers>
          <AppGate>{children}</AppGate>
        </Providers>
      </body>
    </html>
  );
}
