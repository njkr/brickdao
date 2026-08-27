/**
 * Builds the message the frontend asks the wallet to sign, and the backend
 * re-derives to verify against the signature. Loosely modeled on EIP-4361
 * (Sign-In With Ethereum) — enough to bind the signature to this app, this
 * address, and a single-use nonce, without pulling in the full `siwe`
 * package for a project this size.
 */
export function buildSignInMessage(params: {
  domain: string;
  address: string;
  nonce: string;
  issuedAt: string;
}): string {
  const { domain, address, nonce, issuedAt } = params;
  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    '',
    'Sign this message to prove you control this wallet and log in to BrickDAO. This request will not trigger a blockchain transaction or cost any gas.',
    '',
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n');
}
