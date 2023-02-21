# Current

- [ ] Fix loading routes speed, index by pubkey to avoid filtering
- [ ] Include everyone in person list modal, re-fetch missing people
- [ ] Fix initial relay loading, don't nuke people's relay lists
  - [ ] Add a nuclear bypass with a warning, after we fail to find anything
- [ ] Don't waste space caching rooms, load those lazily

# Next

- [ ] Relay detail page, with more information about the relay + tabbed feeds (notes, more?)
- [ ] Add customize icon and route with editable custom view cards using "lists" nip
  - nevent1qqspjcqw2hu5gfcpkrjhs0aqvxuzjgtp50l375mcqjfpmk48cg5hevgpr3mhxue69uhkummnw3ez6un9d3shjtnhd3m8xtnnwpskxegpzamhxue69uhkummnw3ezuendwsh8w6t69e3xj7spramhxue69uhkummnw3ez6un9d3shjtnwdahxxefwv93kzer9d4usz9rhwden5te0wfjkccte9ejxzmt4wvhxjmcpr9mhxue69uhkummnw3ezuer9d3hjuum0ve68wctjv5n8hwfg
  - [ ] Custom views should combine pubkeys, relays, event ids, and topics

# Lightning

- [ ] Linkify invoices
- [ ] Linkify bech32 entities w/ NIP 21 https://github.com/nostr-protocol/nips/blob/master/21.md
- [ ] Support invoices, tips, zaps https://twitter.com/jb55/status/1604131336247476224
  - nevent1qqsd0x0xzfwtppu0n52ngw0zhynlwv0sjsr77aflcpufms2wrl3v8mspr9mhxue69uhhyetvv9ujuumwdae8gtnnda3kjctv9uqs7amnwvaz7tmwdaehgu3wd4hk6d7ewgp

# Groups

- [ ] Groups - may need a new NIP, or maybe use topics

# More

- [ ] Support relay auth
- [ ] Following indicator on person info
- [ ] Share button for notes, shows qr code and nevent
- [ ] If a user has no write relays (or is not logged in), open a modal
- [ ] open web+nostr links like snort
- [ ] Channels
  - [ ] Separate chat and DMs
  - [ ] Damus has chats divided into DMs and requests
  - [ ] Ability to leave/mute DM conversation
  - [ ] Add petnames for channels
  - [ ] Add notifications for chat messages
- [ ] Add encrypted settings storage using nostr events
  - [ ] Save DM/chat read status in encrypted note
- [ ] Relay recommendations based on follows/followers
- [ ] Pinned posts ala snort
- [ ] Likes list on note detail. Maybe a sidebar or header for note detail page?
- [ ] Support key delegation
  - https://github.com/nbd-wtf/nostr-tools/blob/master/nip26.ts
- [ ] Add keyword mutes
- [ ] Attachments (a tag w/content type and url)
- [ ] Sign in as user with one click to view things from their pubkey's perspective - do this with multiple accounts
  - nevent1qqsyyxtrhpsqeqaqgucd6uzpyh8eq2hkfgr0yzr7ku7tgyl5cn9jw5qpz3mhxue69uhhyetvv9ujumn0wd68ytnzvuq3gamnwvaz7tmjv4kxz7fwv3sk6atn9e5k7l564wx
- [ ] Search by nip05 alias
  - nevent1qqsdt4ux9c0zvd6hzpwnzznjsmd7a337mpxdspu9wd4fq8drvqejdmqpz3mhxue69uhhyetvv9ujuerpd46hxtnfduqs6amnwvaz7tmwdaejumr0dsffemjp
- [ ] Show options on note detail for retrieving replies
  - Replies from user's network
  - All replies from author's + user's read relays, including spam
- [ ] Topics/hashtag views
- [ ] Re-license using https://polyformproject.org/
- [ ] Image uploads
  - Default will charge via lightning and have a tos, others can self-host and skip that.
  - Add banner field to profile
  - Linode/Digital Ocean
  - https://github.com/brandonsavage/Upload
  - https://github.com/seaweedfs/seaweedfs
  - https://github.com/cubefs/cubefs
- [ ] Separate settings for read, write, and broadcast relays based on NIP 65
- [ ] Release to android
  - https://svelte-native.technology/docs
  - https://ionic.io/blog/capacitor-everything-youve-ever-wanted-to-know
- [ ] Add no-relay gossip
  - Capture certain events in a local db
  - File import/export from db, NFC transfer
  - Save user notes to db
  - Fixes when you hide something, but the event doesn't get retrived, and it gets un-hidden
- [ ] Keep track of all relays an event was seen on
- [ ] Use nip 56 for reporting
  - https://github.com/nostr-protocol/nips/pull/205#issuecomment-1419234230
- [ ] Sync mentions box and in-reply mentions
- [ ] Compress events
  - https://github.com/nostr-protocol/nips/issues/265#issuecomment-1434250263
- [ ] Refine feeds
  - [ ] Trim feeds once the user scrolls way down to save on memory
  - [ ] Don't lose feeds when navigating, persist modals. Remember scroll state
- [ ] Offline-first
