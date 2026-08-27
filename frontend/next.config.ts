import type { NextConfig } from "next";

// RainbowKit's default wallet list includes a "Base" wallet, which pulls in
// @coinbase/cdp-sdk. That package does string-literal `import()`s of
// @x402/core, @x402/evm, and @x402/svm (its optional x402-payments peer
// deps) guarded by a runtime try/catch, expecting bundlers to leave them
// unresolved until actually invoked. We never invoke x402 payments (this is
// an EVM-only property-tokenization app), but Turbopack resolves dynamic
// imports statically at build/dev time and fails outright when a peer dep
// isn't installed. Alias them to an empty stub instead of installing an
// unused Solana/x402 dependency tree. Turbopack's resolveAlias targets must
// be POSIX-style relative specifiers, not OS absolute paths (a Windows
// backslash path fails with "windows imports are not implemented yet").
const x402StubPath = "./src/stubs/x402-optional-dep-stub.ts";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'images.unsplash.com' }],
  },
  turbopack: {
    resolveAlias: {
      "@x402/core/client": x402StubPath,
      "@x402/evm": x402StubPath,
      "@x402/evm/exact/client": x402StubPath,
      "@x402/evm/upto/client": x402StubPath,
      "@x402/svm/exact/client": x402StubPath,
    },
  },
};

export default nextConfig;
