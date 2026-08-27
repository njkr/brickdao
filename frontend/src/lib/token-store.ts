/**
 * Access token lives only in memory + sessionStorage (cleared when the tab
 * closes); the longer-lived refresh token is the only thing persisted
 * across sessions. Kept separate from api.ts so the auth context can read/
 * clear tokens without importing the whole API client.
 */
const ACCESS_TOKEN_KEY = 'brickdao.accessToken';
const REFRESH_TOKEN_KEY = 'brickdao.refreshToken';

let accessToken: string | null = null;
let refreshToken: string | null = null;
let hydrated = false;

function hydrate() {
  if (hydrated || typeof window === 'undefined') return;
  accessToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  hydrated = true;
}

export function setTokens(tokens: { accessToken: string; refreshToken: string }) {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  hydrated = true;
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  }
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  hydrated = true;
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

export function getAccessToken(): string | null {
  hydrate();
  return accessToken;
}

export function getRefreshToken(): string | null {
  hydrate();
  return refreshToken;
}
