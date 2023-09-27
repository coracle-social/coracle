# What is this?

Coracle is a web client for the Nostr protocol focused on pushing the boundaries of what's unique about nostr, including relay selection and management, web-of-trust based moderation and content recommendations, and privacy protection. Check it out at [coracle.social](https://coracle.social).

[Dufflepud](https://github.com/coracle-social/dufflepud) is a companion server which you can self-host. It helps Coracle with things like link previews and image uploads.

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
- [x] Bech32 entity search and scan
- [x] Mention, reply, and reaction notifications
- [x] Direct messages - NIP 04 and NIP 24
- [x] Note composition with mentions and topics
- [x] Content warnings, mute, and keyword mute
- [x] Profile pages, follow/unfollow, follow/follower count
- [x] Thread muting, collapse thread
- [x] Invoice, quote, mention, link, image, and video rendering
- [x] Installable as a progressive web app
- [x] Integrated media uploads via nostr.build
- [x] Lightning zaps and reactions
- [x] Feeds customizable by person, relay, and topic using NIP-51
- [x] AUTH (NIP-42) support for paid relays
- [x] Multiplextr support for reducing bandwidth
- [x] Profile and note metadata
- [x] White-labeling support
- [x] NIP 51 person lists
- [x] Exportable copy of all user events
- [ ] Reporting and basic distributed moderation
- [ ] Content and person recommendations
- [ ] Private groups including administration, moderation, and membership
- [ ] Cross-posting between groups and public nostr
- [ ] Public and private calendar events
- [ ] Public and private marketplaces

You can find a more complete changelog [here](./CHANGELOG.md).

# Run  Coracle locally:

- Clone the project repository: `git clone https://github.com/coracle-social/coracle.git`
- Navigate to the project directory: `cd coracle`
- Install dependencies: `yarn`
- Customize configuration in `.env` (optional)
- Start the development server: `yarn dev`
