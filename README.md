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
- [x] Direct messages using NIP 04

# Snacks

- [ ] Add nip05 verification on feed
- [ ] Linkify follow/followers numbers
- [ ] Support key delegation
  - https://github.com/nbd-wtf/nostr-tools/blob/master/nip26.ts
- [ ] Add keyword mutes
- [ ] Add encrypted settings storage using nostr events
- [ ] Attachments (a tag w/content type and url)
- [ ] Linkify bech32 entities w/ NIP 21 https://github.com/nostr-protocol/nips/blob/master/21.md
- [ ] Sign in as user with one click to view things from their pubkey's perspective - do this with multiple accounts

# Missions

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
- [ ] Separate settings for read, write, and broadcast relays based on NIP 65
- [ ] Release to android with https://svelte-native.technology/docs
- [ ] Add no-relay gossip
  - Capture certain events in a local db
  - File import/export from db, NFC transfer
  - Save user notes to db

# Maintenance

- [ ] Normalize relay urls (lowercase, strip trailing slash)
- [ ] Use nip 56 for reporting
  - https://github.com/nostr-protocol/nips/pull/205#issuecomment-1419234230
- [ ] Change network tab to list relays the user is connected to
- [ ] Sync mentions box and in-reply mentions
- [ ] Channels
  - [ ] Ability to leave/mute DM conversation
  - [ ] Add petnames for channels
  - [ ] Add notifications for chat messages

# Current

- [ ] Switch to localforage
  - Check that firefox private mode works (it won't work in dev)
- [ ] Add modal for follows/followers
- [ ] Implement gossip model https://bountsr.org/code/2023/02/03/gossip-model.html
- [ ] Make feeds page customizable. This could potentially use the "lists" NIP
- [ ] Show notification at top of feeds: "Showing notes from 3 relays". Click to customize.
- [ ] Click through on relays page to view a feed for only that relay.
- [ ] Custom views: slider between fast/complete with a warning at either extreme

# Changelog

## 0.2.11

- [x] Converted threshold to percentage
- [x] Fixed slow leaving/joining chat rooms

## 0.2.10

- [x] Fixed likes not showing up in alerts
- [x] Raised threshold for pool to 2 so we don't have such a small amount of results
- [x] Wait for profile info on login, navigate to network by default
- [x] Fix mention selection, inheritance, and inclusion in notes
- [x] Parse links without http at the beginning
- [x] Clean up back button in combination with modals
- [x] Re-design relays page and person relays list with metadata
- [x] Add relay selection to new note screen

## 0.2.9

- [x] Fixed a bug in pool.subscribe which was causing requests to wait for all connections
- [x] Added typescript with pre-commit hook
- [x] Fixed layout for chat, person pages
- [x] Parse relays for kind 3

## 0.2.8

- [x] Stop showing replies at top level in feeds to make it more interesting
- [x] Fix a bug that was preventing people from sending a message
- [x] Stop sending IP addresses to bugsnag
- [x] Fix some layout bugs

## 0.2.7

- [x] Added direct messages and group chat
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
- [x] Added analytics and error reporting (opt out supported)

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
