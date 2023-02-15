# Current

- [ ] Review 10002 usage https://github.com/nostr-protocol/nips/blob/master/65.md
- [ ] Make feeds page customizable. This could potentially use the "lists" NIP
  - nevent1qqspjcqw2hu5gfcpkrjhs0aqvxuzjgtp50l375mcqjfpmk48cg5hevgpr3mhxue69uhkummnw3ez6un9d3shjtnhd3m8xtnnwpskxegpzamhxue69uhkummnw3ezuendwsh8w6t69e3xj7spramhxue69uhkummnw3ez6un9d3shjtnwdahxxefwv93kzer9d4usz9rhwden5te0wfjkccte9ejxzmt4wvhxjmcpr9mhxue69uhkummnw3ezuer9d3hjuum0ve68wctjv5n8hwfg
  - [ ] Click through on relays page to view a feed for only that relay.
  - [ ] Custom views should combine pubkeys, relays, event ids, and topics

- [ ] Fix anon/new user experience
  - [ ] Clicking stuff that would publish kicks you to the login page, we should open a modal instead.
- [ ] Initial user load doesn't have any relays, cache user or wait for people db to be loaded
- [ ] Fix bugs on bugsnag

# Snacks

- [ ] Relay recommendations based on follows/followers
- [ ] Pinned posts ala snort
- [ ] Likes list on note detail. Maybe a sidebar or header for note detail page?
- [ ] Support key delegation
  - https://github.com/nbd-wtf/nostr-tools/blob/master/nip26.ts
- [ ] Add keyword mutes
- [ ] Add encrypted settings storage using nostr events
- [ ] Attachments (a tag w/content type and url)
- [ ] Linkify bech32 entities w/ NIP 21 https://github.com/nostr-protocol/nips/blob/master/21.md
- [ ] Sign in as user with one click to view things from their pubkey's perspective - do this with multiple accounts
  - nevent1qqsyyxtrhpsqeqaqgucd6uzpyh8eq2hkfgr0yzr7ku7tgyl5cn9jw5qpz3mhxue69uhhyetvv9ujumn0wd68ytnzvuq3gamnwvaz7tmjv4kxz7fwv3sk6atn9e5k7l564wx
- [ ] Search by nip05 alias
  - nevent1qqsdt4ux9c0zvd6hzpwnzznjsmd7a337mpxdspu9wd4fq8drvqejdmqpz3mhxue69uhhyetvv9ujuerpd46hxtnfduqs6amnwvaz7tmwdaejumr0dsffemjp

# Missions

- [ ] Are write relays the only ones that matter? User read relays only matter for global feed, or where there's no relay hints available. But if relays are navigable, this is unnecessary.
- [ ] Topics/hashtag views
- [ ] Support paid relays
  - atlas.nostr.land
  - eden.nostr.land
- [ ] Image uploads
  - Default will charge via lightning and have a tos, others can self-host and skip that.
  - Add banner field to profile
  - Linode/Digital Ocean
  - https://github.com/brandonsavage/Upload
  - https://github.com/seaweedfs/seaweedfs
  - https://github.com/cubefs/cubefs
- [ ] Support relay auth
- [ ] Support invoices, tips, zaps https://twitter.com/jb55/status/1604131336247476224
  - nevent1qqsd0x0xzfwtppu0n52ngw0zhynlwv0sjsr77aflcpufms2wrl3v8mspr9mhxue69uhhyetvv9ujuumwdae8gtnnda3kjctv9uqs7amnwvaz7tmwdaehgu3wd4hk6d7ewgp
- [ ] Separate settings for read, write, and broadcast relays based on NIP 65
- [ ] Release to android
  - https://svelte-native.technology/docs
  - https://ionic.io/blog/capacitor-everything-youve-ever-wanted-to-know
- [ ] Add no-relay gossip
  - Capture certain events in a local db
  - File import/export from db, NFC transfer
  - Save user notes to db

# Maintenance

- [ ] Don't waste space caching rooms, load those lazily
- [ ] Normalize relay urls (lowercase, strip trailing slash)
- [ ] Use nip 56 for reporting
  - https://github.com/nostr-protocol/nips/pull/205#issuecomment-1419234230
- [ ] Sync mentions box and in-reply mentions
- [ ] Channels
  - [ ] Damus has chats divided into DMs and requests
  - [ ] Ability to leave/mute DM conversation
  - [ ] Add petnames for channels
  - [ ] Add notifications for chat messages
