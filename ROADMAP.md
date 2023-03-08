# Current

- [ ] Collapse relaycard and relaycardsimple?
- [ ] Create my own version of nostr.how and extension explanation
- [ ] Make new notes thing fixed position

- [ ] Review sampleRelays, seems like we shouldn't be shuffling
- [ ] Go over onboarding process, suggest some good relays for newcomers
- [ ] Submit blog post with new onboarding process built in
- [ ] Fix hover on notes in modal
- [ ] Show loading/success on zap invoice screen
- [ ] Fix iOS/safari/firefox
- [ ] Show more link on long notes (rather than just an ellipsis)

# Coracle website

- [ ] Simple intro to coracle
- [ ] Add nip05 to coracle
  - [ ] After ~10 sessions prompt them to verify and update their nip05
  - [ ] Maybe only if they don't have a nip05 yet

# Others

- Tool for finding relays with light usage so people can spread out
  - Graph view? Query db with COUNT? Hardware specs on relay info endpoint?
  - "adoptarelay.com"
  - Add suggested relays based on follows or topics
- Recommendations
- Indexer/multiplexer
- relay.coracle.social for people nip-05 verified via coracle
- Improve overall design
- Stripped down easy version of coracle
  - Extract library?
  - Parameterize color scheme
  - Deploy to special domains with relays built in

# Custom views

- [ ] Add QR code that pre-fills follows and relays for a new user
  - If logged in, open a detail page that shows the relays and people
  - If not logged in, pre-populate follows/relays in onboarding flow
- [ ] If someone logs in with their private key, create a notification to install an extension
- [ ] Add customize icon and route with editable custom view cards using "lists" nip
  - nevent1qqspjcqw2hu5gfcpkrjhs0aqvxuzjgtp50l375mcqjfpmk48cg5hevgpr3mhxue69uhkummnw3ez6un9d3shjtnhd3m8xtnnwpskxegpzamhxue69uhkummnw3ezuendwsh8w6t69e3xj7spramhxue69uhkummnw3ez6un9d3shjtnwdahxxefwv93kzer9d4usz9rhwden5te0wfjkccte9ejxzmt4wvhxjmcpr9mhxue69uhkummnw3ezuer9d3hjuum0ve68wctjv5n8hwfg
  - [ ] Custom views should combine pubkeys, relays, event ids, and topics

# More

- [ ] Abort all context subs when navigating
- [ ] Separate mentions from other notifications
- [ ] Performance
  - same deal as with formatTimestamp, don't use functions inline since svelte can't cache them
- [ ] Image Uploads
  - [ ] Add LN invoices
  - [ ] Contact other client authors, self-hostable, or just use my instance
  - https://github.com/ElementsProject/lightning-charge
  - https://github.com/nostr-protocol/nips/pull/250
- [ ] Onboarding
  - [ ] Auto-follow hodlbod
  - [ ] Add a friendly tour
  - [ ] Send a note to @coracle for help
- [ ] https://media.nostr.band/
- [ ] Make the note relays button modal make sense, one relay with no explanation is not good
- [ ] Linkify invoices
- [ ] Linkify bech32 entities w/ NIP 21
  - https://github.com/nostr-protocol/nips/blob/master/21.md
  - https://github.com/nostr-protocol/nips/issues/319
- [ ] Person zaps
- [ ] Collapsible thread view
- [ ] Split notifications into replies + everything else, or add filters
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
- [ ] Groups - may need a new NIP, or maybe use topics
- [ ] Support https://github.com/nostr-protocol/nips/pull/211 as a bech32 entity
- [ ] Add "new DM" button to dms list
- [ ] Support relay auth
- [ ] Share button for notes, shows qr code and nevent
- [ ] open web+nostr links like snort
- [ ] Ability to leave/mute DM conversation
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
- [ ] Sign in as user with one click to view things from their pubkey's perspective
  - nevent1qqsyyxtrhpsqeqaqgucd6uzpyh8eq2hkfgr0yzr7ku7tgyl5cn9jw5qpz3mhxue69uhhyetvv9ujumn0wd68ytnzvuq3gamnwvaz7tmjv4kxz7fwv3sk6atn9e5k7l564wx
- [ ] Multiple accounts
- [ ] Show options on note detail for retrieving replies
  - Replies from user's network
  - All replies from author's + user's read relays, including spam
- [ ] Topics/hashtag views
- [ ] Re-license using https://polyformproject.org/
- [ ] Separate settings for read, write, and broadcast relays based on NIP 65
- [ ] Release to android
  - https://svelte-native.technology/docs
  - https://ionic.io/blog/capacitor-everything-youve-ever-wanted-to-know
  - Or just wrap it in an apk
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
- [ ] Add support for nests https://nostrnests.com/
  - nevent1qqs2jm46m9tg9z33av4fp8hhapsx96234htz75wrvpvrax5jjl8m5usprfmhxue69uhhyetvv9ujumn0wd68yurvv438xtnrdaksy4d92m
