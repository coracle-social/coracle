# nostr-engine

A batteries-included utility library for building sophisticated nostr clients.

## File structure

Engine is divided into several "pods" which each provide a certain slice of functionality. They are logically grouped, but have interdependencies, so it's not exactly a buffet. The different concepts each pod contains are as follows:

- model - types describing what sort of data the pod deals with.
- state - simple, standalone data stores for the pod's data. These are enhanced svelte stores.
- utils - any pure functions, getters, or utilities for interacting with external resources.
- derived - derived stores, combining data from the pod, potentially with data from outside it.
- requests - functions for retrieving data from the network.
- commands - functions that a can be called to affect state. May have side effects.
- projections - listeners for incoming events that update state within the pod. May trigger other commands.

Any pod can depend on another, at a lower level of functionality. So, any pod's `derived` can depend on any pod's `state`.
