# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Coracle is a web client for the Nostr protocol, built as a Progressive Web App with native mobile support via Capacitor. It features relay management, web-of-trust moderation, customizable feeds, encrypted DMs, Lightning zaps, and a marketplace.

**Live:** `app.coracle.social` (master), `dev.coracle.social` (dev branch)

## Commands

```bash
pnpm install                    # Install dependencies
pnpm run dev                    # Dev server at http://localhost:5173
pnpm run build                  # Production build (requires: pnpm i sharp --include=optional)
pnpm run test:unit              # Unit tests (vitest)
pnpm run test:e2e               # E2E tests (cypress)
pnpm run check                  # All checks: TypeScript + ESLint + formatting
pnpm run check:ts               # Type check only (svelte-check)
pnpm run check:es               # ESLint only
pnpm run check:fmt              # Prettier check (changed files only)
pnpm run format                 # Auto-format changed files
pnpm run run:android            # Build and run on Android
pnpm run release:android        # Build release APK
```

**Node version:** 22.x (see `.nvmrc`)

## Pre-commit Hook

The husky pre-commit hook runs `pnpm run check` and also rejects commits if `package.json` contains any `link:` overrides (from local welshman development via `./link_deps`).

## Architecture

Four main layers, each with increasing coupling:

1. **`src/util/`** — Stateless utility functions (routing, nostr parsing, i18n, misc helpers). No dependency on app or engine.
2. **`src/engine/`** — Nostr-specific "backend": global state (`state.ts` — the largest file), storage, commands, requests, notifications. Heavy use of `@welshman` libraries.
3. **`src/partials/`** — General-purpose Svelte components (Modal, Toast, theme state). Depends only on `util/`. Not coupled to Nostr specifics.
4. **`src/app/`** — Application components and state:
   - `views/` — Route and modal components. Many serve as both (clicking a link opens a modal rather than navigating, preserving user context).
   - `shared/` — Reusable components that may depend on `engine` and `app/state`.
   - `state.ts` — App-level state (drafts, search, menu, analytics).
   - `util/router.ts` — Custom router with Nostr entity decoders (npub, nprofile, note, nevent, naddr).

**Routing model:** Traditional SPA routing + layered modals. `App.svelte` defines routes with component mapping, auth requirements (`requireUser`, `requireSigner`), and parameter validation.

## Key Libraries

- **`@welshman/*`** (10 packages) — Core Nostr ecosystem: app state, content parsing, editor, feeds, networking, routing, signing, stores. Coracle makes heavy use of these. For local development against welshman, use `./link_deps` (requires clean git tree or `--force`).
- **nostr-tools** — Low-level Nostr protocol utilities.
- **Svelte 4** — Component framework with reactive stores.
- **Vite** — Build tool with PWA plugin, dynamic HTML meta injection.
- **Capacitor** — Native mobile bridge (Android/iOS). App ID: `social.coracle.app`.

## Code Style

- **Prettier:** No semicolons, 100 char width, `bracketSameLine`, arrow parens avoided. Svelte order: options-styles-scripts-markup.
- **TypeScript:** Lenient — `strictNullChecks: false`, `noImplicitAny: false`. Path alias: `src/*`.
- **ESLint:** Flat config. Enforces `eqeqeq`, `prefer-const`, `no-unused-vars`. Disables some a11y rules.
- Style is procedural with some functional paradigms. Objects mostly as singletons with an initialization step. Use svelte stores and welshman library when possible.

## Environment & White-labeling

Copy `.env.template` to `.env` for configuration. The app is white-label configurable via `VITE_*` env vars: theme colors, relay sets, app name/logo, feature flags (zaps, marketplace), default follows, platform pubkey, etc.

## ZEN Integration (zen branch)

This fork adds UPlanet/ẐEN cooperative economy features:
- `src/util/zen.ts` — ZEN balance service: checks Ğ1 balances, extracts profile identities (g1pub, zencard, ipns_vault), formats ZEN amounts.
- ZEN = internal cooperative unit derived from Ğ1: `(Ğ1_balance - 1) × 10 = ZEN`
- Two token types: MULTIPASS (usage tokens for likes/services) and ZEN Card (property tokens/cooperative shares).
- Liking a post costs 1 ẐEN (enforced by relay write policy).

## Git Workflow

- PRs should target `dev` branch (auto-deployed to dev.coracle.social).
- `master` auto-deploys to app.coracle.social.
- Never add Co-Authored-By in commits.
