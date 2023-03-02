# Current

- [ ] Try adding boxes/separation on feeds based on user feedback
- [ ] Strip zero width spaces from compose
- [ ] Fix iOS/safari/firefox
- [ ] Make the note relays button modal make sense, one relay with no explanation is not good

# Image uploads

- Default will charge via lightning and have a tos, others can self-host and skip that.
- https://github.com/ElementsProject/lightning-charge
- https://github.com/nostr-protocol/nips/pull/250
- https://github.com/brandonsavage/Upload
- https://github.com/seaweedfs/seaweedfs
- https://github.com/cubefs/cubefs

# Custom views

- [ ] Add customize icon and route with editable custom view cards using "lists" nip
  - nevent1qqspjcqw2hu5gfcpkrjhs0aqvxuzjgtp50l375mcqjfpmk48cg5hevgpr3mhxue69uhkummnw3ez6un9d3shjtnhd3m8xtnnwpskxegpzamhxue69uhkummnw3ezuendwsh8w6t69e3xj7spramhxue69uhkummnw3ez6un9d3shjtnwdahxxefwv93kzer9d4usz9rhwden5te0wfjkccte9ejxzmt4wvhxjmcpr9mhxue69uhkummnw3ezuer9d3hjuum0ve68wctjv5n8hwfg
  - [ ] Custom views should combine pubkeys, relays, event ids, and topics

# More

- [ ] Linkify invoices
- [ ] Linkify bech32 entities w/ NIP 21 https://github.com/nostr-protocol/nips/blob/master/21.md
- [ ] Person zaps
- [ ] Add dynamic title tag
- [ ] Collapsible thread view
- [ ] Split inbox into replies + everything else
- [ ] Show more link on long notes
- [ ] Show popover on delayed hover rather than click (on mobile, keep it click)
- [ ] Light mode
- [ ] Mute threads http://localhost:5173/nevent1qqsyz8x6r0cu7l6vwlcjhf8qhxyjtdykvuervkc3t3mfggse4qtwt0gpyfmhxue69uhkummnw3ezumrfvfjhyarpwdc8y6tddaexg6t4d5hxxmmdnhxvea
- [ ] Add webtorrent support
  - https://coracle.social/nevent1qqsxgxcsq5vevy4wdty5z5v88nhwp2fc5qgl0ws5rmamn6z72hwv3qcpyfmhxue69uhkummnw3ez6an9wf5kv6t9vsh8wetvd3hhyer9wghxuet5qk6c9q
- [ ] Add coracle relay
  - Authenticated write, public read
  - Only accepts events from people with a @coracle.social nip05
- [ ] Apply person popover to mentions in notes as well
- [ ] Invite link, nprofile + path that prompts someone to sign in or create an account and auto-follow the inviter
- [ ] Cache follower numbers to avoid re-fetching so much
- [ ] Allow the user to disable likes/zaps
- [ ] NIP for group membership
- [ ] Polls
  - Find the best implementation https://github.com/nostr-protocol/nips/search?q=poll&type=issues
  - Comment on all three nip drafts which one I implemented
- [ ] Micro app DSL
- [ ] Sort feeds by created date on profile page?
- [ ] Implement https://media.nostr.band/
- [ ] Groups - may need a new NIP, or maybe use topics
- [ ] Support https://github.com/nostr-protocol/nips/pull/211 as a bech32 entity
- [ ] Add new DM button to dms list
- [ ] Add suggested relays based on follows or topics
- [ ] Support relay auth
- [ ] Following indicator on person info
- [ ] Share button for notes, shows qr code and nevent
- [ ] If a user has no write relays (or is not logged in), open a modal
- [ ] open web+nostr links like snort
- [ ] Channels
  - [ ] Separate chat and DMs
  - [ ] Don't waste space caching rooms, load those lazily
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
- [ ] Separate settings for read, write, and broadcast relays based on NIP 65
- [ ] Release to android
  - https://svelte-native.technology/docs
  - https://ionic.io/blog/capacitor-everything-youve-ever-wanted-to-know
  - Or just wrap it
- [ ] When publishing fails, enqueue and retry
  - Track which relays the events should be published to, and which ones have succeeded
  - Maybe notify and ask user which events to re-publish.
- [ ] Add no-relay gossip
  - Capture user events in a local db
  - Possibly release "local relay" as a library
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
