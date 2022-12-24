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
- [ ] Mentions - render done, now reference in compose
- [ ] Image uploads
- [ ] An actual readme
- [ ] Server discovery and relay publishing - https://github.com/nostr-protocol/nips/pull/32/files
- [ ] Support invoices https://twitter.com/jb55/status/1604131336247476224
- [ ] Expand/collapse large threads
- [ ] NIP 05

# Bugs

- [ ] Add alerts for replies to posts the user liked
- [ ] With link/image previews, remove the url from the note body if it's on a separate last line
- [ ] Stack views so scroll position isn't lost on navigation
- [ ] Add notification for slow relays
- [ ] Parent notes are having a hard time loading

# Changelog

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
