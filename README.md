# Flotilla

A discord-like nostr client. WIP.


Figure out state management. Add fetched_at to all events. `fetch` batches and loads, `get` gets the value, `derive` returns a store. For optimization, create getters for everything that uses `get` a lot.
