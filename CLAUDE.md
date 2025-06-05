# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flotilla is a Discord-like Nostr client that operates on the concept of "relays as groups/spaces." Built with SvelteKit 2.5 and Svelte 5, it provides messaging, threads, calendar events, and social features across Nostr relays.

## Architecture

### Core Technology Stack
- **SvelteKit 2.5 + Svelte 5** - Reactive UI framework with runes
- **Welshman Libraries** - Comprehensive Nostr toolkit (@welshman/app, @welshman/net, @welshman/signer, etc.)
- **TailwindCSS + DaisyUI** - Utility-first styling with component library
- **Capacitor 7** - Cross-platform mobile deployment
- **TypeScript** - Full type safety throughout

### State Management Patterns
- Svelte stores with Welshman reactive patterns
- Repository pattern for Nostr event storage with 10k event limit
- Derived stores for computed values and real-time updates
- Event-based architecture with reactive data flow

## Important Patterns

### Finding Code
- Prefer navigating from one file to the next following imports when possible
- If search is necessary, use `ack`, not `grep` or `rg`.

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
- Prefer seconds to milliseconds when handling nostr events.

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
