'use client';

import { motion } from 'framer-motion';
import { AlertCircleIcon, PenLineIcon } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from './ui/button';
import { Logo } from './ui/logo';

/**
 * Shown once a wallet is connected but hasn't signed the backend's
 * sign-in message yet. Being "connected" and being "authenticated" are
 * different things here on purpose: BrickFi's wallet gate and its backend
 * auth were never linked, so here the wallet must also sign in to the API.
 */
export function SignInScreen() {
  const { address, isLoading, signInError, signIn } = useAuth();

  return (
    <div className="min-h-screen bg-void-950 text-cream-100 flex flex-col relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-[700px] h-[700px] bg-accent/[0.06] rounded-full blur-[140px]" />
        <div className="absolute bottom-1/4 right-0 w-[550px] h-[550px] bg-secondary/[0.05] rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-brick-pattern opacity-50" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center max-w-md w-full p-10 rounded-2xl glass-panel"
        >
          <div className="mb-8">
            <Logo size="large" />
          </div>

          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-secondary/10 border border-accent/25 flex items-center justify-center mb-6 shadow-glow-sm">
            <PenLineIcon size={28} className="text-accent" />
          </div>

          <h2 className="font-display text-2xl font-semibold text-cream-100 mb-3">One more step</h2>
          <p className="text-cream-400 mb-2 leading-relaxed">
            Sign a free message with your wallet to prove you control{' '}
            <span className="text-cream-200 font-mono">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>{' '}
            and log in to BrickDAO.
          </p>
          <p className="text-cream-400/70 text-sm mb-8">
            This does not cost gas and will not send a transaction.
          </p>

          {signInError && (
            <div className="w-full mb-6 flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-left">
              <AlertCircleIcon size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-sm">{signInError}</p>
            </div>
          )}

          <Button fullWidth size="lg" onClick={() => void signIn()} disabled={isLoading}>
            {isLoading ? 'Waiting for signature…' : 'Sign in with wallet'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
