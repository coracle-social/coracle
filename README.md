# What is this?

Coracle is a web client for the Nostr protocol. While Nostr is useful for many things, Coracle focuses on providing a high-quality social media experience. Check it out at [coracle.social](https://coracle.social).

[Dufflepud](https://github.com/staab/dufflepud) is a companion server which you can self-host. It helps Coracle with things like link previews and image uploads.

Coracle is currently in _alpha_ - expect bugs, slow loading times, and rough edges.

If you like Coracle and want to support its development, you can donate sats via [Geyser](https://geyser.fund/project/coracle).

# Features

- [x] Chat
- [x] Threads/social
- [x] Search
- [x] Notifications
- [x] Link previews
- [x] Add notes, follows, likes tab to profile
- [x] Mentions
- [ ] Persist and load relay list
- [ ] Add followers/follows lists on profile page
- [ ] Image uploads
  - Use dufflepud. Default will charge via lightning and have a tos, others can self-host and skip that.
- [ ] Server discovery and relay publishing https://github.com/nostr-protocol/nips/pull/32/files
- [ ] Support invoices https://twitter.com/jb55/status/1604131336247476224
- [ ] NIP 05
- [ ] Lightning tips
- [ ] Direct messages https://github.com/nbd-wtf/nostr-tools/blob/master/nip04.ts
- [ ] Rooms/groups
- [ ] Custom feeds
- [ ] Render and auto-link bech32 entities
  - https://github.com/nostr-protocol/nips/blob/master/19.md
  - https://github.com/nbd-wtf/nostr-tools/blob/master/nip19.ts
- [ ] Support key delegation
  - https://github.com/nbd-wtf/nostr-tools/blob/master/nip26.ts
- [ ] Add relay selector when publishing a note
- [ ] Add keyword mutes
- [ ] Add no-relay gossip
  - Capture certain events in a local db
  - File import/export from db, NFC transfer
- [ ] Save user notes to db
- [ ] Release to android with https://svelte-native.technology/docs
- [ ] Add settings storage on nostr, maybe use kind 0?
- [ ] Stack views so scroll position isn't lost on navigation
- [ ] Suggest relays based on network
- [ ] Attachments (a tag w/content type and url)
- [ ] Add Labs tab with cards for non-standard features
  - Time travel - see events as of a date/time

# Changelog

## Current

- [x] Upgrade nostr-tools
- [x] Publish user relays using nip 23
- [x] Use user relays for feeds
- [x] Publish to user relays + target relays:
- [x] Add correct recommended relay to tags
- [x] Relays
  - [x] Support some read/write config
  - [x] Get real home relays for defaults.petnames
  - [x] Add notification for slow relays
  - [x] Fix publishing
  - [x] Relay list isn't getting refreshed since we're using getRelay everywhere
- [x] Warn that everything will be cleared on logout
- [x] Connection management
  - [x] Do I need to implement re-connecting now?
  - [x] Handle failed connections
  - [x] Close connections that haven't been used in a while
  - [x] Add strategy that callers can opt into to accept first eose from a relay that has any events
- [ ] Login
  - [x] Prefer extension, make private key entry "advanced"
  - [x] Buttons should redirect to login modal if using pubkey login
- [ ] We often get the root as the reply, figure out why that is, compared to astral/damus
- [x] Load feeds from network rather than user relays?
  - [x] Still use "my" relays for global, this could make global feed more useful
  - [x] If we use my relays for global, we don't have to wait for network to load initially
  - [ ] Figure out fast vs complete tradeoff. Skipping loadContext speeds things up a ton
- [ ] Figure out migrations from previous version
- [ ] Add relays/mentions to note and reply composition
- [ ] Add layout component with max-w, padding, etc. Test on mobile size
- [ ] Add tips to login spinner
- [ ] Add banner

## 0.2.7

- [x] Add support for profile banner images
- [x] Re-designed relays page
  - [x] Support connection status/speed indication
  - [x] Add toggle to enable writing to a connected relay
- [x] Re-designed login page
  - [x] Use private key login only if extension is not enabled
  - [x] Add pubkey login

## 0.2.6

- [x] Add support for at-mentions in note and reply composition
- [x] Improve cleanup on logout
- [x] Move add note button to be available everywhere
- [x] Fix reporting relay along with tags
- [x] Add support for bech32 keys
- [x] Add second order follows to network tab
- [x] Add favicon and social media preview image
- [x] Extract urls in person bios
- [x] Add follow/follower counts

## 0.2.5

- [x] Batch load context for feeds

## 0.2.4

- [x] Fix reactions - livequery is required in order to listen for changes

## 0.2.3

- [x] Fix reactions - we'll show new reactions optimistically to avoid complexity in listeners

## 0.2.2

- [x] Show notification for new notes rather than automatically adding them to the feed
- [x] Improve slow relay pruning by using a timeout for each relay
- [x] Re-work feed loading - go to network first and fall back to cache to ensure results that are as complete as possible
- [x] Slightly improved context fetching to reduce subscriptions
- [x] Split person feeds out into separate components
- [x] Add timeout in scroller to keep polling for new results
- [x] Fix fall-through on user badge click on alerts page
- [x] Fix deletion of old events, be more aggressive

## 0.2.1

- [x] Exclude people from search who have no profile data available
- [x] Speed up note retrieval by sorting first when the filter isn't restrictive
- [x] Only show a certain number of replies on popular notes, with a link at the bottom showing total replies
- [x] Refine algorithm for which relays to drop when they don't send an eose. This helps avoid the "we couldn't find this note" error message on the note detail, since we were giving up too early.
- [x] Improve url detection and shortening

## 0.2.0

- [x] Completely re-worked data synchronization layer, moving from naive just-in-time requests to background listeners, loaders, and a local copy stored in dexie. Events and tags, but not people are deleted from the database on logout, and old events are periodically purged.
- [x] Added alert badge and page.
- [x] Improved relay page. Suggestions are now taken from
- [x] Removed chat to keep scope of work smaller. Let me know if you'd like to see that come back.
- [x] Split tabs out into separate components
- [x] Removed dispatch, added cmd instead
- [x] Added image previews in addition to link previews
- [x] Fixed infinite scrolling
- [x] Removed cursor/listener abstractions
- [x] Added some default pubkeys
- [x] Wait for some, not all relays to send eose to keep things fast
- [x] General refactoring and bugfixing
