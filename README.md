# Flotilla

A discord-like nostr client based on the idea of "relays as groups". WIP.

# Deploy

To run your own Flotilla, it's as simple as `npm run build`, then serve the `build` directory.

# Development

Run `npm run dev` to get a dev server, and `npm run check:watch` to watch for typescript errors. When you're ready to commit, run `npm run format && npm run lint` and fix any errors that come up.

# Todo

- [ ] Hook up donate buttons
- [ ] Mobile version
- [ ] Single-relay version
- [ ] Relay access detection
- [ ] Env vars for:
  - Theme
  - Relay

---

- [ ] If the user isn't following anyone, show warning/fallback on people/notes pages
- [ ] Show warning if people in a dm conversation don't have a 10050
- [ ] Add react/reply to notes
- [ ] Indicate cut-off images, allow user to expand
- [ ] Sort/migrate repository data to keep important events
  - Get rid of stuff from spaces the user isn't currently a member of
- [ ] Apply mutes
- [ ] Add discover > people/content tabs that pull from network rather than follows
- [ ] Add redirect on successful login to the page they originally were going for
