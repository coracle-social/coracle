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
- [ ] Support invoices https://twitter.com/jb55/status/1604131336247476224
- [ ] Expand/collapse large threads
- [ ] NIP 05

# Bugs

- [ ] Use https://nostr.watch/relays.json to populate relays
- [ ] Add alerts for replies to posts the user liked
- [ ] With link/image previews, remove the url from the note body if it's on a separate last line
- [ ] Stack views so scroll position isn't lost on navigation
- [ ] Add notification for slow relays
- [ ] Wait for 60% or so of relays to eose to balance completeness with speed
- [ ] Add a CSP, check for XSS in image urls

# Current update

- [ ] Write blog post
- [x] Sync user
- [x] Based on petnames, sync network to 2 or 3 degrees of separation
  - When a user is added/removed, sync them and add to or remove from network
- [x] Add cursor object to handle since/until/last sync
- [x] Separate fetching and loading from the db
  - Each route should have a fetcher and loader.
  - The fetcher should keep track of the range of notes it has already gotten
  - Separate helper functions into loaders and fetchers
- [x] Main fetch requests:
  - Fetch feed by name, since last sync
  - Fetch person, including feed
  - Fetch note, including context
  - This is based on detail pages. Each request should check local db and fall back to network, all within an await.

# Problems to solve

- [ ] How will newcomers get followed?
