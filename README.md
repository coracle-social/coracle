# What is this?

Coracle is a web client for the Nostr protocol focused on pushing the boundaries of what's unique about nostr, including relay selection and management, web-of-trust based moderation and content recommendations, and privacy protection. Check it out at [coracle.social](https://coracle.social).

If you like Coracle and want to support its development, you can donate sats via [Geyser](https://geyser.fund/project/coracle).

# Features

- [x] Threads/social
- [x] Profile search using NIP-50
- [x] Login via extension, nsecbunker, and pubkey
- [x] Profile sharing via QR codes
- [x] NIP 05 verification
- [x] NIP 65 relay selection and NIP 32 relay reviews
- [x] NIP 89 app recommendations
- [x] NIP 32 labeling and recommendations
- [x] NIP 99 classifieds
- [x] NIP 52 calendar events
- [x] NIP 87 closed groups
- [x] NIP 72 communities
- [x] NIP 89 client tag support
- [x] NIP 89 handler integration
- [x] NIP 32 labeling and collections
- [x] NIP 17 DMs
- [x] Private group calendars and listings
- [x] Cross-posting between communities and main feed
- [x] Bech32 entity search and scan
- [x] Mention, reply, and reaction notifications
- [x] Direct messages - NIP 04 and NIP 24
- [x] Note composition with mentions and topics
- [x] Content warnings, mute, and keyword mute
- [x] Profile pages, follow/unfollow, follow/follower count
- [x] Thread muting, collapse thread
- [x] Invoice, quote, mention, link, image, and video rendering
- [x] Installable as a progressive web app
- [x] Integrated media uploads via NIP 96
- [x] Lightning zaps and reactions
- [x] Feeds customizable by person, relay, and topic using NIP-51
- [x] AUTH (NIP-42) support for closed relays
- [x] Multiplextr support for reducing bandwidth
- [x] Profile and note metadata
- [x] White-labeling support
- [x] NIP 51 person lists
- [x] Exports/imports of user events
- [x] User profile editing
- [x] NIP XX encrypted read receipts for notifications
- [x] Topic and relay feeds
- [x] Onboarding workflow
- [x] Multi-account support
- [x] Notifications view
- [x] Web of trust scores for less spam and better group/feed suggestions
- [x] Customizable and shareable feeds and lists
- [x] Customizable invite links
- [x] Reporting via tagr-bot
- [x] Nostr Wallet Connect support
- [x] Date/time localization

You can find a more complete changelog [here](./CHANGELOG.md).

# Run Coracle locally:

- Clone the project repository: `git clone https://github.com/coracle-social/coracle.git`
- Navigate to the project directory: `cd coracle`
- Install dependencies: `pnpm i`
- Customize configuration in `.env` (optional, see below)
- Start the development server: `pnpm run dev`
- In order for `pnpm run build` to work, you'll need to run `pnpm i sharp --include=optional` first.

# Tests

- Run all tests: `pnpm run test`
- Run unit tests: `pnpm run test:unit`
- Run e2e tests: `pnpm run test:e2e`

# Building for Android

Make sure you have the android build tools in your path and run:

```
pnpm run build:android --keystorepath <path> --keystorepass <password> --keystorealias <alias> --keystorealiaspass <password>
```

# Uploading sourcemaps

Source maps are uploaded using the sentry cli to a self-hosted glitchtip instance. See the `sourcemaps` script in `package.json` for details. More information here: https://gitlab.com/glitchtip/glitchtip-backend/-/issues/322

# Customization

Coracle is intended to be fully white-labeled by groups of various kinds. The following environment variables can be set in `.env.local` to customize Coracle's appearance and behavior:

- `VITE_DARK_THEME` and `VITE_LIGHT_THEME` are comma-separate lists of key/value pairs defining theme colors.
- `VITE_DVM_RELAYS` is a comma-separated list of relays to use when making requests against DVMs.
- `VITE_SEARCH_RELAYS` is a comma-separated list of relays to use when using NIP 50 search.
- `VITE_DEFAULT_RELAYS` is a comma-separated list of relays to use as defaults/fallbacks.
- `VITE_DEFAULT_FOLLOWS` is a comma-separated list of hex pubkeys to fetch content from when the user isn't following anyone.
- `VITE_ONBOARDING_LISTS` is a comma-separated list of `kind:30003` person lists to populate onboarding with.
- `VITE_NIP96_URLS` is a comma-separated list of default upload providers.
- `VITE_IMGPROXY_URL` is an [imgproxy](https://imgproxy.net) instance url for protecting user privacy and reducing bandwidth use.
- `VITE_DUFFLEPUD_URL` is a [Dufflepud](https://github.com/coracle-social/dufflepud) instance url, which helps Coracle with things like link previews and image uploads.
- `VITE_PLATFORM_ZAP_SPLIT` is a decimal between 0 and 1 defining the default zap split percent.
- `VITE_PLATFORM_PUBKEY` is the pubkey of the platform owner. This gets zapped when using the platform zap split.
- `VITE_ENABLE_ZAPS` can be set to `false` to disable zaps.
- `VITE_APP_NAME` is the app's name.
- `VITE_APP_URL` is the app's url. Used to generate open graph meta tags.
- `VITE_APP_LOGO` is the path for the app's logo relative to the `public` directory, starting with a leading slash. Used to generate favicons and manifest.
- `VITE_APP_WORDMARK_DARK` and `VITE_APP_WORDMARK_LIGHT` are paths for the app's wordmark relative to the `public` directory, starting with a leading slash.
- `VITE_APP_DESCRIPTION` is the app's description.
- `VITE_CLIENT_NAME` is the client's name. Only change this if you have forked Coracle.
- `VITE_CLIENT_ID` is the client's NIP 89 handler id. Only change this if you have forked Coracle.
- `VITE_GLITCHTIP_API_KEY` is your glitchtip DSN.
- `GLITCHTIP_API_KEY` is your glitchtip auth token for uploading source maps.
- `VITE_BUILD_HASH` can be set during build to indicate the software version on the about page.
- `VITE_LOG_LEVEL` can be set to `info`, `warn`, or `error`. This controls how much shows up in the console.
- `VITE_ENABLE_MARKET` can be set to `false` to disable the marketplace tab.

See `.env` for default values.
