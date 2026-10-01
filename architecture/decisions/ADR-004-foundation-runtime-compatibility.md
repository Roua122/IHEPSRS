# ADR-004 — Foundation Runtime Compatibility

Status: Accepted  
Date: 2026-10-01

## Context
The first real Foundation execution used Node.js 22.18 and pnpm 12.8.1.
TypeScript 6 rejected legacy `moduleResolution=node` and deprecated `baseUrl` configuration.

## Decision
- Standardize the current prototype development baseline on Node.js 22.18+.
- Use `NodeNext` module/moduleResolution for Node/Nest packages.
- Remove deprecated `baseUrl` from backend configs.
- Build the shared `@ihepsrs/contracts` package before API typecheck/build.
- Use Vite/Bundler-oriented TypeScript settings only in the web app.
- Explicitly deny the non-essential `@scarf/scarf` dependency build script in pnpm workspace config.

## Consequences
The project follows TypeScript 6 modern module-resolution rules and avoids silent dependency build scripts.
