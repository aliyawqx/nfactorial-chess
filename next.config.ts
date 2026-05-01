import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // COOP/COEP headers will be added in Phase 3 when Stockfish WASM with threads is integrated.
  // They enable SharedArrayBuffer required for stockfish.wasm threaded mode.
};

export default nextConfig;
