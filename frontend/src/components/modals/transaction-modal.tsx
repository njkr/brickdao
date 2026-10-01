'use client';

import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircleIcon, CheckCircleIcon, InfoIcon, LoaderIcon, XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { formatEther, parseEther } from 'viem';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import { api } from '@/lib/api';
import { assetFactoryAbi, ASSET_FACTORY_ADDRESS } from '@/lib/contracts/config';
import type { Property } from '@/types/property';
import { Button } from '../ui/button';

type TransactionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  property: Pick<Property, 'id' | 'title' | 'tokenPrice' | 'tokenId' | 'contractAddress'>;
};

type Status = 'initial' | 'confirming' | 'mining' | 'success' | 'error';

/**
 * Places a real on-chain purchase against AssetFactory.buy(). BrickFi's
 * version of this modal was a setTimeout with a Math.random() coin flip —
 * so it never reflected a real purchase. If no contract is configured for
 * this property yet, that's shown plainly instead of faking a result.
 */
export function TransactionModal({ isOpen, onClose, property }: TransactionModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [status, setStatus] = useState<Status>('initial');
  const [tokenAmount, setTokenAmount] = useState(1);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const receipt = useWaitForTransactionReceipt({ hash: txHash });

  const contractAddress = (property.contractAddress || ASSET_FACTORY_ADDRESS) as `0x${string}` | '';
  const isConfigured = Boolean(contractAddress && property.tokenId !== null);

  const totalCost = parseEther(String(property.tokenPrice)) * BigInt(tokenAmount);

  const handleClose = () => {
    if (status === 'confirming' || status === 'mining') return;
    setStatus('initial');
    setTokenAmount(1);
    setTxHash(undefined);
    setErrorMessage(null);
    onClose();
  };

  const handleTransaction = async () => {
    if (!isConfigured || !address || property.tokenId === null) return;
    setStatus('confirming');
    setErrorMessage(null);
    try {
      const hash = await writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: assetFactoryAbi,
        functionName: 'buy',
        args: [BigInt(property.tokenId), address, BigInt(tokenAmount), '0x'],
        value: totalCost,
      });
      setTxHash(hash);
      setStatus('mining');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'The transaction was rejected.');
      setStatus('error');
    }
  };

  // Once the transaction is mined, record it against the signed-in user's portfolio.
  useEffect(() => {
    if (status !== 'mining') return;

    if (receipt.isSuccess && txHash) {
      api
        .addTransaction({
          type: 'PURCHASE',
          propertyId: property.id,
          tokens: tokenAmount,
          value: Number(formatEther(totalCost)),
          txHash,
        })
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ['portfolio'] });
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
          queryClient.invalidateQueries({ queryKey: ['property', property.id] });
        })
        .catch(() => {
          // The on-chain purchase itself still succeeded even if recording it failed.
        })
        .finally(() => setStatus('success'));
      return;
    }

    if (receipt.isError) {
      setErrorMessage('The transaction failed on-chain.');
      setStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, receipt.isSuccess, receipt.isError, txHash]);

  const handleViewPortfolio = () => {
    handleClose();
    router.push('/user');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-void-950/80 backdrop-blur-md z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl glass-panel shadow-glow-sm p-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-xl font-semibold text-cream-100">
                  {status === 'initial' && 'Purchase tokens'}
                  {status === 'confirming' && 'Confirm in wallet'}
                  {status === 'mining' && 'Processing'}
                  {status === 'success' && 'Complete'}
                  {status === 'error' && 'Failed'}
                </h3>
                <button
                  onClick={handleClose}
                  disabled={status === 'confirming' || status === 'mining'}
                  className="p-2 rounded-lg text-cream-400 hover:text-cream-100 hover:bg-void-700 transition-colors disabled:opacity-50"
                >
                  <XIcon size={20} />
                </button>
              </div>

              {!isConfigured && (
                <div className="text-center py-6">
                  <div className="inline-flex mb-4 text-secondary">
                    <InfoIcon size={40} />
                  </div>
                  <h4 className="font-display text-lg font-semibold text-cream-100 mb-2">Not tokenized yet</h4>
                  <p className="text-cream-400 mb-6">
                    This property isn&apos;t linked to a deployed AssetFactory contract yet, so there&apos;s
                    nothing to buy on-chain. An admin needs to set its contract address and token id first.
                  </p>
                  <Button variant="outline" onClick={handleClose} fullWidth>
                    Close
                  </Button>
                </div>
              )}

              {isConfigured && status === 'initial' && (
                <>
                  <div className="mb-6 space-y-4">
                    <p className="text-cream-400">
                      <span className="text-cream-200 font-medium">{property.title}</span>
                      <br />
                      Token price: <span className="text-accent">{property.tokenPrice} ETH</span>
                    </p>
                    <div>
                      <label className="block text-sm font-medium text-cream-400 mb-2">Number of tokens</label>
                      <div className="flex items-center gap-0">
                        <button
                          type="button"
                          onClick={() => setTokenAmount((n) => Math.max(1, n - 1))}
                          className="bg-void-700 border border-void-600 text-cream-100 px-3 py-2.5 rounded-l-xl hover:bg-void-600 transition-colors"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={tokenAmount}
                          onChange={(e) => setTokenAmount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                          min={1}
                          className="w-20 bg-void-700 border-y border-void-600 text-cream-100 text-center py-2.5 focus:outline-none focus:ring-2 focus:ring-accent/40"
                        />
                        <button
                          type="button"
                          onClick={() => setTokenAmount((n) => n + 1)}
                          className="bg-void-700 border border-void-600 text-cream-100 px-3 py-2.5 rounded-r-xl hover:bg-void-600 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-void-700/50 border border-void-600 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-cream-400">Total (cost × amount)</span>
                        <span className="text-cream-100">{formatEther(totalCost)} ETH</span>
                      </div>
                      <p className="text-xs text-cream-400/70">Plus gas, paid to your wallet directly.</p>
                    </div>
                  </div>
                  <Button onClick={() => void handleTransaction()} fullWidth>
                    Confirm purchase
                  </Button>
                </>
              )}

              {(status === 'confirming' || status === 'mining') && (
                <div className="text-center py-10">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="inline-flex mb-4"
                  >
                    <LoaderIcon size={48} className="text-accent" />
                  </motion.div>
                  <p className="text-cream-300 mb-1">
                    {status === 'confirming' ? 'Waiting for wallet confirmation…' : 'Waiting for the transaction to be mined…'}
                  </p>
                  <p className="text-sm text-cream-400">Do not close this window.</p>
                </div>
              )}

              {status === 'success' && (
                <div className="text-center py-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                    className="inline-flex mb-4 text-emerald-400"
                  >
                    <CheckCircleIcon size={48} />
                  </motion.div>
                  <h4 className="font-display text-xl font-semibold text-cream-100 mb-2">Purchase successful</h4>
                  <p className="text-cream-400 mb-6">
                    You purchased {tokenAmount} token{tokenAmount > 1 ? 's' : ''} of {property.title}.
                  </p>
                  <Button onClick={handleViewPortfolio} fullWidth>
                    View portfolio
                  </Button>
                </div>
              )}

              {status === 'error' && (
                <div className="text-center py-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 12 }}
                    className="inline-flex mb-4 text-red-400"
                  >
                    <AlertCircleIcon size={48} />
                  </motion.div>
                  <h4 className="font-display text-xl font-semibold text-cream-100 mb-2">Transaction failed</h4>
                  <p className="text-cream-400 mb-6 break-words">{errorMessage ?? 'Something went wrong.'}</p>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={handleClose} fullWidth>
                      Cancel
                    </Button>
                    <Button onClick={() => void handleTransaction()} fullWidth>
                      Try again
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
