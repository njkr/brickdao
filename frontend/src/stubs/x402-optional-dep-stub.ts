// See the comment on `resolveAlias` in next.config.ts. `toClientEvmSigner` is
// the one named export actually statically imported (from `@x402/evm`) along
// this app's reachable bundle path; the dynamic `import()`s elsewhere in
// @coinbase/cdp-sdk destructure their results at runtime, so they don't need
// real exports here — they're only reached if x402 payments are actually
// invoked, which this app never does.
export function toClientEvmSigner(): never {
  throw new Error('x402 payments are not supported in this app.');
}
