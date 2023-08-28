# What is this?

Coracle is a web client for the Nostr protocol focused on pushing the boundaries of what's unique about nostr, including relay selection and management, web-of-trust based moderation and content recommendations, and privacy protection. Check it out at [coracle.social](https://coracle.social).

[Dufflepud](https://github.com/coracle-social/dufflepud) is a companion server which you can self-host. It helps Coracle with things like link previews and image uploads.

If you like Coracle and want to support its development, you can donate sats via [Geyser](https://geyser.fund/project/coracle).

# Features

- [x] Threads/social
- [x] Profile search using NIP-50
- [x] Login via extension
- [x] Profile sharing via QR codes
- [x] NIP 05 verification
- [x] Bech32 entity search
- [x] Notifications
- [x] Chat and direct messages
- [x] Note composition with mentions and topics
- [x] Profile pages, follow/unfollow
- [x] Thread and person muting, collapse thread
- [x] Smart relay selection and display
- [x] Invoice, quote, mention, link, image, and video rendering
- [x] Installable as a progressive web app
- [x] Integrated media uploads
- [x] Lightning zaps
- [x] Feeds customizable by person, relay, and topic using NIP-51
- [x] AUTH (NIP-42) support for paid relays
- [x] Multiplextr support for reducing bandwidth
- [x] Profile and note metadata
- [x] White-labeling support
- [ ] Exportable copy of all user events
- [ ] Reporting and basic distributed moderation
- [ ] Content and person recommendations

You can find a more complete changelog [here](./CHANGELOG.md).

# Run  Coracle locally:

- Clone the project repository: `git clone https://github.com/coracle-social/coracle.git`
- Navigate to the project directory: `cd coracle`
- Install dependencies: `yarn`
- Customize configuration in `.env` (optional)
- Start the development server: `yarn dev`
