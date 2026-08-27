'use client';

import { motion } from 'framer-motion';
import { ArrowUpRightIcon } from 'lucide-react';
import Link from 'next/link';
import { GithubIcon, LinkedinIcon, TwitterIcon } from '@/components/ui/brand-icons';

const footerLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'How It Works', href: '/about' },
  { label: 'Browse Properties', href: '/browse' },
  { label: 'Terms of Service', href: '#' },
];

const socialLinks = [
  { icon: GithubIcon, href: '#' },
  { icon: TwitterIcon, href: '#' },
  { icon: LinkedinIcon, href: '#' },
];

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-void-700/60 bg-void-900/70 backdrop-blur-sm">
      <div className="absolute inset-0 bg-brick-pattern opacity-50 pointer-events-none" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-18 relative">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-16">
          <div className="md:col-span-5">
            <Link href="/" className="inline-block font-display text-2xl font-bold text-cream-100 tracking-tight mb-4">
              Brick<span className="text-accent">DAO</span>
            </Link>
            <p className="text-cream-400 text-base leading-relaxed max-w-sm">
              Where bricks meet blockchain. BrickDAO tokenizes premium real estate into on-chain assets — own
              fractions, earn rental yields, and build wealth brick by brick.
            </p>
            <div className="flex gap-4 mt-6">
              {socialLinks.map(({ icon: Icon, href }, index) => (
                <motion.a
                  key={`${href}-${index}`}
                  href={href}
                  whileHover={{ y: -2 }}
                  className="p-2.5 rounded-xl bg-void-700/80 text-cream-400 hover:text-accent hover:bg-void-600 border border-void-600 hover:border-accent/30 transition-all"
                >
                  <Icon size={20} />
                </motion.a>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 md:col-start-7">
            <h3 className="font-display font-semibold text-cream-100 text-sm uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {footerLinks.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="group inline-flex items-center gap-1.5 text-cream-400 hover:text-accent transition-colors text-sm"
                  >
                    {label}
                    <ArrowUpRightIcon
                      size={14}
                      className="opacity-0 -translate-y-0.5 translate-x-0.5 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-4 md:col-start-10 flex flex-col justify-end">
            <p className="text-secondary text-xs font-medium uppercase tracking-wider mb-2">
              Build wealth, brick by brick
            </p>
            <p className="text-cream-400/70 text-sm">&copy; {new Date().getFullYear()} BrickDAO. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
