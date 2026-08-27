'use client';

import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { BlocksIcon, BuildingIcon, CoinsIcon, EditIcon, PlusIcon, ShieldIcon, TrashIcon } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PropertyFormModal } from '@/components/modals/property-form-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';
import { useProperties } from '@/lib/queries';
import type { Property } from '@/types/property';

const STATUS_LABEL = { AVAILABLE: 'Available', SOLD_OUT: 'Sold Out', COMING_SOON: 'Coming Soon' } as const;

export default function Admin() {
  const { isAuthenticated, isAdmin } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'properties' | 'contracts'>('properties');
  const [formTarget, setFormTarget] = useState<'closed' | 'create' | Property>('closed');

  const { data: properties = [] } = useProperties();
  const tokenizedProperties = properties.filter((p) => p.contractAddress);

  const invalidateProperties = () => queryClient.invalidateQueries({ queryKey: ['properties'] });

  const handleDelete = async (property: Property) => {
    if (!window.confirm(`Delete "${property.title}"? This can't be undone.`)) return;
    await api.deleteProperty(property.id);
    await invalidateProperties();
  };

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md w-full p-10 rounded-2xl glass-panel"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-secondary/10 border border-accent/25 flex items-center justify-center mx-auto mb-6 shadow-glow-sm">
            <ShieldIcon size={32} className="text-accent" />
          </div>
          <p className="font-display text-secondary text-xs uppercase tracking-widest mb-3">BrickDAO Admin</p>
          <h2 className="font-display text-2xl font-semibold text-cream-100 mb-3">Admin access required</h2>
          <p className="text-cream-400 mb-8 leading-relaxed">
            You need admin privileges to manage BrickDAO properties and smart contracts.
          </p>
          <Button onClick={() => router.push('/')}>Back to Home</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 lg:py-20">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-muted border border-accent/25 mb-4">
                <BlocksIcon size={14} className="text-accent" />
                <span className="font-display text-accent text-xs uppercase tracking-widest font-semibold">
                  BrickDAO Admin
                </span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold text-cream-100 mb-2">Admin Dashboard</h1>
              <p className="text-cream-400">Tokenize properties, manage contracts, and oversee the platform</p>
            </div>
            <Button icon={<PlusIcon size={18} />} onClick={() => setFormTarget('create')}>
              Tokenize property
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {[
              { icon: BuildingIcon, label: 'Total properties', value: properties.length, color: 'cream' },
              { icon: CoinsIcon, label: 'Tokenized contracts', value: tokenizedProperties.length, color: 'accent' },
              {
                icon: BlocksIcon,
                label: 'Total tokens sold',
                value: properties.reduce((sum, p) => sum + p.tokensSold, 0),
                color: 'secondary',
              },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="p-6 rounded-2xl glass-panel hover:border-accent/20 transition-all"
              >
                <div className="flex items-center gap-2 text-cream-400 text-sm mb-2">
                  <stat.icon size={16} className={stat.color === 'accent' ? 'text-accent' : stat.color === 'secondary' ? 'text-secondary' : ''} />
                  {stat.label}
                </div>
                <div
                  className={`font-display text-2xl font-bold ${
                    stat.color === 'accent' ? 'text-accent' : stat.color === 'secondary' ? 'text-secondary' : 'text-cream-100'
                  }`}
                >
                  {stat.value}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="rounded-2xl glass-panel overflow-hidden">
            <nav className="flex border-b border-void-700/80">
              {(['properties', 'contracts'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-4 flex items-center gap-2 text-sm font-medium transition-colors ${
                    activeTab === tab ? 'border-b-2 border-accent text-accent bg-accent-muted/30' : 'text-cream-400 hover:text-cream-100'
                  }`}
                >
                  {tab === 'properties' ? <BuildingIcon size={16} /> : <CoinsIcon size={16} />}
                  {tab === 'properties' ? 'Properties' : 'Contracts'}
                </button>
              ))}
            </nav>
            <div className="p-6">
              {activeTab === 'properties' && (
                <div>
                  <h3 className="font-display text-lg font-semibold text-cream-100 mb-6">Manage properties</h3>
                  <div className="overflow-x-auto rounded-xl border border-void-700/80">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b border-void-700/80 bg-void-800/40">
                          <th className="px-6 py-3 text-left text-xs font-medium text-cream-400 uppercase tracking-wider">Property</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-cream-400 uppercase tracking-wider">Location</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-cream-400 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-cream-400 uppercase tracking-wider">Price</th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-cream-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-void-700/80">
                        {properties.map((p) => (
                          <tr key={p.id} className="hover:bg-accent-muted/10 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="relative h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-void-600">
                                  <Image src={p.imageUrl} alt={p.title} fill sizes="40px" className="object-cover" />
                                </div>
                                <span className="font-medium text-cream-100">{p.title}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-cream-400">{p.location}</td>
                            <td className="px-6 py-4">
                              <Badge color={p.status === 'AVAILABLE' ? 'green' : p.status === 'SOLD_OUT' ? 'red' : 'yellow'}>
                                {STATUS_LABEL[p.status]}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-accent font-semibold">{p.tokenPrice} ETH</td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" size="sm" icon={<EditIcon size={14} />} onClick={() => setFormTarget(p)}>
                                  Edit
                                </Button>
                                <Button variant="danger" size="sm" icon={<TrashIcon size={14} />} onClick={() => void handleDelete(p)}>
                                  Delete
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {activeTab === 'contracts' && (
                <div>
                  <h3 className="font-display text-lg font-semibold text-cream-100 mb-6">Tokenized properties</h3>
                  {tokenizedProperties.length === 0 ? (
                    <p className="text-cream-400 text-sm py-8 text-center">
                      No property has a contract address set yet. Edit a property to attach one.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-xl border border-void-700/80">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-void-700/80 bg-void-800/40">
                            <th className="px-6 py-3 text-left text-xs font-medium text-cream-400 uppercase tracking-wider">Property</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-cream-400 uppercase tracking-wider">Contract</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-cream-400 uppercase tracking-wider">Token ID</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-void-700/80">
                          {tokenizedProperties.map((p) => (
                            <tr key={p.id} className="hover:bg-accent-muted/10 transition-colors">
                              <td className="px-6 py-4 text-cream-100">{p.title}</td>
                              <td className="px-6 py-4 text-secondary font-mono text-sm">{p.contractAddress}</td>
                              <td className="px-6 py-4 text-cream-400">{p.tokenId}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <PropertyFormModal
        isOpen={formTarget !== 'closed'}
        onClose={() => setFormTarget('closed')}
        initialValue={formTarget === 'closed' || formTarget === 'create' ? null : formTarget}
        onSubmit={async (values) => {
          if (formTarget === 'create') {
            await api.createProperty(values);
          } else if (formTarget !== 'closed') {
            await api.updateProperty(formTarget.id, values);
          }
          await invalidateProperties();
        }}
      />
    </div>
  );
}
