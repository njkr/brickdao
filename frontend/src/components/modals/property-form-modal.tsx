'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { XIcon } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';
import type { Property, PropertyStatus } from '@/types/property';
import { Button } from '../ui/button';

type PropertyFormValues = {
  title: string;
  description: string;
  imageUrl: string;
  location: string;
  price: number;
  tokenPrice: number;
  totalTokens: number;
  status: PropertyStatus;
  features: string[];
  returnRate?: number;
  contractAddress?: string;
  tokenId?: number;
};

type PropertyFormModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: PropertyFormValues) => Promise<void>;
  initialValue?: Property | null;
};

const EMPTY_FORM: PropertyFormValues = {
  title: '',
  description: '',
  imageUrl: '',
  location: '',
  price: 0,
  tokenPrice: 0,
  totalTokens: 1000,
  status: 'AVAILABLE',
  features: [],
};

function toFormValues(property?: Property | null): PropertyFormValues {
  if (!property) return EMPTY_FORM;
  return {
    title: property.title,
    description: property.description,
    imageUrl: property.imageUrl,
    location: property.location,
    price: property.price,
    tokenPrice: property.tokenPrice,
    totalTokens: property.totalTokens,
    status: property.status,
    features: property.features,
    returnRate: property.returnRate ?? undefined,
    contractAddress: property.contractAddress ?? undefined,
    tokenId: property.tokenId ?? undefined,
  };
}

/** Shared create/edit form for admin property management. */
export function PropertyFormModal({ isOpen, onClose, onSubmit, initialValue }: PropertyFormModalProps) {
  const [values, setValues] = useState<PropertyFormValues>(() => toFormValues(initialValue));
  const [featuresText, setFeaturesText] = useState(() => toFormValues(initialValue).features.join(', '));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Re-seed the form whenever a different property is opened for editing.
  const key = initialValue?.id ?? 'new';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        ...values,
        features: featuresText
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-void-950/80 backdrop-blur-md z-50"
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <motion.div
              key={key}
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-2xl glass-panel shadow-glow-sm p-6 my-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-display text-xl font-semibold text-cream-100">
                  {initialValue ? 'Edit property' : 'Tokenize property'}
                </h3>
                <button onClick={onClose} className="p-2 rounded-lg text-cream-400 hover:text-cream-100 hover:bg-void-700">
                  <XIcon size={20} />
                </button>
              </div>

              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                <Field label="Title">
                  <input
                    required
                    value={values.title}
                    onChange={(e) => setValues({ ...values, title: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Description">
                  <textarea
                    required
                    rows={3}
                    value={values.description}
                    onChange={(e) => setValues({ ...values, description: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Image URL">
                  <input
                    required
                    type="url"
                    value={values.imageUrl}
                    onChange={(e) => setValues({ ...values, imageUrl: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Location">
                  <input
                    required
                    value={values.location}
                    onChange={(e) => setValues({ ...values, location: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Price (USD)">
                    <input
                      required
                      type="number"
                      min={0}
                      value={values.price}
                      onChange={(e) => setValues({ ...values, price: Number(e.target.value) })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Token price (ETH)">
                    <input
                      required
                      type="number"
                      min={0}
                      step="0.001"
                      value={values.tokenPrice}
                      onChange={(e) => setValues({ ...values, tokenPrice: Number(e.target.value) })}
                      className={inputClass}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Total tokens">
                    <input
                      required
                      type="number"
                      min={1}
                      value={values.totalTokens}
                      onChange={(e) => setValues({ ...values, totalTokens: Number(e.target.value) })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Status">
                    <select
                      value={values.status}
                      onChange={(e) => setValues({ ...values, status: e.target.value as PropertyStatus })}
                      className={inputClass}
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="SOLD_OUT">Sold Out</option>
                      <option value="COMING_SOON">Coming Soon</option>
                    </select>
                  </Field>
                </div>
                <Field label="Features (comma-separated)">
                  <input value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} className={inputClass} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Annual return %">
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={values.returnRate ?? ''}
                      onChange={(e) => setValues({ ...values, returnRate: e.target.value ? Number(e.target.value) : undefined })}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="ERC-1155 token id">
                    <input
                      type="number"
                      min={0}
                      value={values.tokenId ?? ''}
                      onChange={(e) => setValues({ ...values, tokenId: e.target.value ? Number(e.target.value) : undefined })}
                      className={inputClass}
                    />
                  </Field>
                </div>
                <Field label="AssetFactory contract address">
                  <input
                    value={values.contractAddress ?? ''}
                    onChange={(e) => setValues({ ...values, contractAddress: e.target.value || undefined })}
                    placeholder="0x…"
                    className={inputClass}
                  />
                </Field>

                {error && <p className="text-sm text-red-400">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={onClose} fullWidth>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} fullWidth>
                    {isSubmitting ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

const inputClass =
  'w-full bg-void-700 border border-void-600 rounded-xl px-4 py-2.5 text-cream-100 placeholder-cream-400/50 focus:outline-none focus:ring-2 focus:ring-accent/40';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-cream-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
