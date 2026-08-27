import { useQuery } from '@tanstack/react-query';
import { api } from './api';

export function useProperties(query: Record<string, string> = {}) {
  return useQuery({
    queryKey: ['properties', query],
    queryFn: () => api.getProperties(query),
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: ['property', id],
    queryFn: () => api.getProperty(id),
    enabled: Boolean(id),
  });
}

export function usePortfolio() {
  return useQuery({
    queryKey: ['portfolio'],
    queryFn: () => api.getPortfolio(),
  });
}

export function useTransactions(type?: 'PURCHASE' | 'YIELD') {
  return useQuery({
    queryKey: ['transactions', type ?? 'all'],
    queryFn: () => api.getTransactions(type),
  });
}
