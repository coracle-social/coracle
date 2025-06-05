# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flotilla is a Discord-like Nostr client that operates on the concept of "relays as groups/spaces." Built with SvelteKit 2.5 and Svelte 5, it provides messaging, threads, calendar events, and social features across Nostr relays.

## Development Commands

```bash
# Development
pnpm run dev          # Start dev server on port 1847
pnpm run check        # TypeScript checking
pnpm run check:watch  # Watch mode TypeScript checking

# Production
pnpm run build        # Custom build with env processing
./build.sh            # Main build script with PWA assets
pnpm run sourcemaps   # Build with sourcemap upload

# Code Quality
pnpm run lint         # ESLint + Prettier checking
pnpm run format       # Auto-format with Prettier

# Mobile
pnpm run release:android  # Android APK build
npx cap sync             # Sync web assets to native
```

## Architecture

### Core Technology Stack
- **SvelteKit 2.5 + Svelte 5** - Reactive UI framework with runes
- **Welshman Libraries** - Comprehensive Nostr toolkit (@welshman/app, @welshman/net, @welshman/signer, etc.)
- **TailwindCSS + DaisyUI** - Utility-first styling with component library
- **Capacitor 7** - Cross-platform mobile deployment
- **TypeScript** - Full type safety throughout

### Key Directories
- `/src/app/state.ts` - Global state management, stores, derived values
- `/src/app/components/` - 80+ feature-specific Svelte components
- `/src/lib/components/` - Shared/generic UI components
- `/src/routes/` - SvelteKit file-based routing with dynamic relay/room routes
- `/src/app/commands.ts` - User actions and business logic
- `/src/assets/icons/` - 60+ custom SVG icons

### State Management Patterns
- Svelte stores with Welshman reactive patterns
- Repository pattern for Nostr event storage with 10k event limit
- Derived stores for computed values and real-time updates
- Event-based architecture with reactive data flow

### Nostr Integration Architecture
- **NIP-29 support** - Group chat functionality via relays
- **NIP-46 support** - Remote signing (Nostr Connect/Bunker)
- **Event unwrapping** - Handles gift-wrapped messages for privacy
- **Real-time relay management** - Automatic connection and authentication
- **Web of trust calculations** - User reputation and content filtering

### Mobile & PWA Features
- Responsive navigation (drawer on mobile, sidebar on desktop)
- Capacitor integration for native mobile apps
- PWA with offline support and auto-updating
- Safe area handling for iOS/Android

## Environment Configuration

All environment variables are optional and enable platform customization:

```bash
# Branding
VITE_PLATFORM_NAME="Custom Name"
VITE_PLATFORM_LOGO="/custom-logo.png"
VITE_PLATFORM_DESCRIPTION="Custom description"

# Platform Mode (single-relay instance)
VITE_PLATFORM_RELAYS="wss://relay.example.com"

# Bootstrap and Discovery
VITE_DEFAULT_PUBKEYS="npub1...,npub2..."  # Web of trust seed
VITE_INDEXER_RELAYS="wss://indexer1.com,wss://indexer2.com"

# Monitoring
VITE_GLITCHTIP_API_KEY="..."  # Error reporting
```

The `build.sh` script processes these variables and generates theme files.

## Important Patterns

### Component Organization
- Components are organized by feature (Chat, Calendar, Profile, Space)
- Use existing components from `/lib/components/` before creating new ones
- Follow the established naming convention (PascalCase, descriptive names)

### Routing Structure
- Dynamic routes: `/spaces/[relay]/[room]` for relay-based navigation
- All routes use the `+layout.svelte` for app shell and initialization
- Route helpers in `/src/app/routes.ts` for URL generation

### Nostr Event Handling
- Events flow through the repository pattern in `state.ts`
- Use Welshman utilities for event validation and parsing
- Handle both plain and gift-wrapped events for privacy

### Styling Conventions
- TailwindCSS with DaisyUI components
- Dark/light theme support via CSS custom properties
- Responsive design with mobile-first approach
- Custom color scheme configurable via environment variables
- When styling html, prefer flex/gap classes over margin or space-y classes.

## Testing Notes
This project does not include formal testing infrastructure. Code quality is maintained through TypeScript strict mode, ESLint, Prettier, and Svelte compiler validation.

## Performance Considerations
- Event storage is limited to 10k events with ranking system
- Components use lazy loading patterns
- Large lists should implement virtualization
- Image proxy optimization for external content
