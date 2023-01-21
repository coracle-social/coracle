# What is this?

Coracle is a web client for the Nostr protocol. While Nostr is useful for many things, Coracle focuses on providing a high-quality social media experience. Check it out at [coracle.social](https://coracle.social).

[Dufflepud](https://github.com/staab/dufflepud) is a companion server which you can self-host. It helps Coracle with things like link previews and image uploads.

If you like Coracle and want to support its development, you can donate sats via [Geyser](https://geyser.fund/project/coracle).

# Features

- [x] Chat
- [x] Threads/social
- [x] Search
- [x] Notifications
- [x] Link previews
- [x] Add notes, follows, likes tab to profile
- [x] Mentions
- [x] Persist and load relay list
- [x] NIP 05
- [ ] Direct messages using NIP 04
- [ ] Deploy coracle relay, set better defaults
- [ ] Image uploads
  - Use dufflepud. Default will charge via lightning and have a tos, others can self-host and skip that.
  - Add banner field to profile
- [ ] Release to android with https://svelte-native.technology/docs
- [ ] Support invoices https://twitter.com/jb55/status/1604131336247476224
- [ ] Lightning tips
- [ ] Add followers/follows lists on profile page
- [ ] Rooms/groups
- [ ] Custom feeds
- [ ] Support key delegation
  - https://github.com/nbd-wtf/nostr-tools/blob/master/nip26.ts
- [ ] Add relay selector when publishing a note
- [ ] Add keyword mutes
- [ ] Add no-relay gossip
  - Capture certain events in a local db
  - File import/export from db, NFC transfer
  - Save user notes to db
- [ ] Add settings storage on nostr, maybe use kind 0?
- [ ] Stack views so scroll position isn't lost on navigation
- [ ] Attachments (a tag w/content type and url)
- [ ] Add Labs tab with cards for non-standard features
  - Time travel - see events as of a date/time


# Bugs

- [ ] Sync mentions box and in-reply mentions

# Changelog

## Current

- [ ] Figure out migrations from previous version
- [ ] Fix notes search
- [ ] Chat
  - [ ] Figure out which relays to use
  - [ ] Add petnames for channels
  - [ ] Add back button
  - [ ] Create Room -> open modal, choose dm or public room
  - [x] Add DM button to profile pages
- [ ] Linkify bech32 entities
- [ ] linkify dm page header
- [ ] Add lock/unlock icon to channel header
- [ ] Add notification for dms
- [ ] Default to network/following
- [ ] Add analytics
- [ ] Allow disabling error reporting/analytics

## 0.2.7

- [x] Sped up feeds by requesting less context
- [x] Sped up alerts by storing them in dexie
- [x] Fixed feeds so they don't jump around
- [x] Switched from time-based to limit-based cursors
- [x] Added batching for note context to speed things up
- [x] Fixed support for old-style reply identification
- [x] Improved reliability of event retrieval by following relay hints
- [x] Added default petnames and relays
- [x] Added support for user banners
- [x] Added recommended relay to tags
- [x] Added topics to note composition
- [x] Added a way to remove mentions from replies
- [x] Coracle now publishes user relays using kind 10001 per NIP 23
- [x] Menu now stays open on larger screens
- [x] Standardized some layout components
- [x] Added support for profile banner images
- [x] Support connection status/speed indication on relays
- [x] Add toggle to enable writing to a connected relay
- [x] Re-designed login and relay pages
- [x] Use private key login only if extension is not enabled
- [x] Add pubkey login support
- [x] Removed dexie for most things
- [x] Added support for bech32 entities
- [x] Auto-disconnect/reconnect to spare relay resources
- [x] Added automatic relay discovery
- [x] Added error tracking with bugsnag
- [x] Upgraded nostr-tools
- [x] Added support for NIP-05 verfication

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
