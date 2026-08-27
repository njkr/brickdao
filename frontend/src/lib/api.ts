import type { PortfolioSummary, Property, Transaction } from '@/types/property';
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from './token-store';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type AuthUser = { id: string; address: string; role: 'USER' | 'ADMIN' };
type AuthResponse = { accessToken: string; refreshToken: string; user: AuthUser };

async function request<T>(path: string, options: RequestInit = {}, allowRetry = true): Promise<T> {
  const token = getAccessToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 401 && allowRetry && getRefreshToken()) {
    const refreshed = await tryRefresh();
    if (refreshed) return request<T>(path, options, false);
    clearTokens();
  }

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      body && typeof body === 'object' && 'message' in body
        ? String((body as { message: unknown }).message)
        : response.statusText;
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!response.ok) return false;
    const data = (await response.json()) as AuthResponse;
    setTokens(data);
    return true;
  } catch {
    return false;
  }
}

export const api = {
  requestNonce: (address: string) =>
    request<{ message: string }>('/auth/nonce', {
      method: 'POST',
      body: JSON.stringify({ address }),
    }),

  verifySignature: (address: string, message: string, signature: string) =>
    request<AuthResponse>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ address, message, signature }),
    }),

  logout: () => request<void>('/auth/logout', { method: 'POST' }),

  me: () => request<AuthUser>('/users/me'),

  getProperties: (query: Record<string, string> = {}) => {
    const qs = new URLSearchParams(query).toString();
    return request<Property[]>(`/properties${qs ? `?${qs}` : ''}`);
  },
  getProperty: (id: string) => request<Property>(`/properties/${id}`),
  createProperty: (data: Partial<Property>) =>
    request<Property>('/properties', { method: 'POST', body: JSON.stringify(data) }),
  updateProperty: (id: string, data: Partial<Property>) =>
    request<Property>(`/properties/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProperty: (id: string) => request<void>(`/properties/${id}`, { method: 'DELETE' }),

  getPortfolio: () => request<PortfolioSummary>('/finance/portfolio'),
  getTransactions: (type?: 'PURCHASE' | 'YIELD') =>
    request<Transaction[]>(`/finance/transactions${type ? `?type=${type}` : ''}`),
  addTransaction: (data: {
    type: 'PURCHASE' | 'YIELD';
    propertyId?: string;
    tokens?: number;
    value: number;
    txHash?: string;
  }) => request<Transaction>('/finance/transactions', { method: 'POST', body: JSON.stringify(data) }),

  getCards: () =>
    request<{ id: string; brand: string; last4: string; exp: string; name: string }[]>('/finance/cards'),
  addCard: (data: { brand: string; last4: string; exp: string; name: string }) =>
    request('/finance/cards', { method: 'POST', body: JSON.stringify(data) }),

  getBankAccounts: () =>
    request<{ id: string; bankName: string; accountLast4: string; routing: string }[]>('/finance/banks'),
  addBankAccount: (data: { bankName: string; accountLast4: string; routing: string }) =>
    request('/finance/banks', { method: 'POST', body: JSON.stringify(data) }),
};
