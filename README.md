Bugs

- [ ] Completely redo notes fetching, it's buggy as heck
- [ ] Add alerts for replies to posts the user liked
- [ ] Support bech32 keys/add guide on how to convert
- [ ] Loading icon not showing at bottom
- [ ] uniq and sortBy are sprinkled all over the place, figure out a better solution
- [ ] With link/image previews, remove the url from the note body if it's on a separate last line
- [ ] Search page is slow and likes don't show up. Probably move this server-side
- [ ] Replies counts aren't showing on replies

Features

- [x] Chat
- [x] Threads/social
- [x] Search
- [ ] Mentions
- [x] Notifications
- [x] Link previews
- [x] Add notes, follows, likes tab to profile
- [ ] Images
- [ ] An actual readme
- [ ] Server discovery and relay publishing - https://github.com/nostr-protocol/nips/pull/32/files
- [ ] Favorite chat rooms
- [ ] Optimistically load events the user publishes (e.g. to reduce reflow for reactions/replies).
  - Essentially, we can pretend to be our own in-memory relay.
  - This allows us to keep a copy of all user data, and possibly user likes/reply parents
