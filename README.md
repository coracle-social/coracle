# What is this?

Coracle is a web client for the Nostr protocol. While Nostr is useful for many things, Coracle focuses on providing a high-quality user experience. Check it out at [coracle.social](https://coracle.social).

[Dufflepud](https://github.com/staab/dufflepud) is a companion server which you can self-host. It helps Coracle with things like link previews and image uploads.

Coracle is currently in _alpha_ - expect bugs, slow loading times, and rough edges.

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
- [ ] Favorite chat rooms
- [ ] Optimistically load events the user publishes (e.g. to reduce reflow for reactions/replies).
  - Essentially, we can pretend to be our own in-memory relay.
  - This allows us to keep a copy of all user data, and possibly user likes/reply parents

# Bugs

- [ ] Completely redo notes fetching, it's buggy as heck
  - [ ] uniq and sortBy are sprinkled all over the place, figure out a better solution
  - [ ] Search page is slow and likes don't show up. Probably move this server-side
  - [ ] User detail is not filtering by author
- [ ] Add alerts for replies to posts the user liked
- [ ] Support bech32 keys/add guide on how to convert
- [ ] With link/image previews, remove the url from the note body if it's on a separate last line
- [ ] Stack views so scroll position isn't lost on navigation
- [ ] We're sending client=astral tags, event id 125ff9dc495f65d302e8d95ea6f9385106cc31b81c80e8c582b44be92fa50c44

# Workers

- [ ] Check firefox
