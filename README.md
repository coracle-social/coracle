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

# Bugs

- [ ] Add CSP
- [ ] Reduce reflow on feeds from new stuff coming in
- [ ] Follow fiatjaf's vision of clients being smart and connecting to recommended relays to fetch content
- [ ] Stack views so scroll position isn't lost on navigation
- [ ] Add notification for slow relays, suggest relays based on network
- [ ] Separating events table into notes/reactions/etc would effectively give us a second index on kind.

# Changelog

## Current

- [x] Upgrade nostr-tools
- [x] Publish user relays using nip 23
- [x] Use user relays for feeds
- [ ] Publish to user relays + target relays:
  - If a reply or reaction, publish to the parent event's best relay, which is:
    - e tag relay
    - p tag relay
    - or pubkey's recommended relays
- [ ] Add correct recommended relay to tags
- [ ] Close connections that haven't been used in a while
- [ ] Support some read/write config on relays page
- [ ] Get real home relays for default pubkeys
- [ ] Add settings storage
- [ ] Warn that everything will be cleared on logout
- [ ] Clear dexie on page load, we don't need any persistence other than people/relays
- [ ] Clean up login page to prefer extension, make private key entry "advanced"
- [ ] Do I need to implement re-connecting now?
- [ ] handle localstorage limits https://stackoverflow.com/questions/2989284/what-is-the-max-size-of-localstorage-values
- [ ] Clean up nostr utils
- [ ] Improve login UX for bootstrap delay. Nostr facts?
- [ ] Use bech32 entities
- [ ] Revisit pagination. Use bigger timedelta + limit, set earliest seen timestamp when paginating? Handle no results on page.
- [ ] We often get the root as the reply, figure out why that is
- [ ] Alerts still aren't great. Maybe lazy load? We delete old events, so context will disappear and notes will become empty.

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
