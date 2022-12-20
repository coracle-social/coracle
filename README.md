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
- [ ] Add a coracle relay
- [ ] Mentions - render done, now reference in compose
- [ ] Image uploads
- [ ] An actual readme
- [ ] Server discovery and relay publishing - https://github.com/nostr-protocol/nips/pull/32/files
- [ ] Support invoices https://twitter.com/jb55/status/1604131336247476224

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
- [ ] Add notification for slow relays

# Curreent update

- [ ] Re-implement muffle
- [ ] Delete old events
- [ ] Sync account updates to user for e.g. muffle settings
- [ ] Test nos2x
- [ ] Make sure login/out, no user usage works
- [ ] Add a re-sync/clear cache button
- https://vitejs.dev/guide/features.html#web-workers
- https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
- https://web.dev/module-workers/

- [x] Sync user
- [x] Based on petnames, sync network to 2 or 3 degrees of separation
  - When a user is added/removed, sync them and add to or remove from network
- [ ] Main fetch requests:
  - Fetch feed by name, since last sync
  - Fetch person, including feed
  - Fetch note, including context
  - This is based on detail pages. Each request should check local db and fall back to network, all within an await.
- [ ] How will newcomers get followed?
