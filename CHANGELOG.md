# Changelog

## 0.2.16

- [x] Add search by nip05 (@fiatjaf)
- [x] Fix feed to show more variety
- [x] Beautify notes, modals, reaction buttons
- [x] Add uploads to replies
- [x] Sort replies descending
- [x] Add prettier for formatting
- [x] Refine feed loading to prevent hanging or missing content
- [x] Add new onboarding workflow
- [x] Fix various bugs related to zaps (@fiatjaf)
- [x] Fix horizontal scrolling on profile page (@morkowski)
- [x] Update README with instructions for running manually (@gourcetools)
- [x] Add profile info modal to profile view (@igmaat)
- [x] Optimize event deduplication (@fiatjaf)
- [x] Clean up QR codes
- [x] Give cards a slight border
- [x] Tweak background for image mat
- [x] Set route name to document title

## 0.2.15

- [x] Add zaps

## 0.2.14

- [x] Improve paste support
- [x] Add timestamps to messages
- [x] Support installation as a PWA
- [x] Fix social share image, add description
- [x] Clean up person detail actions, maybe click one circle and show the rest
- [x] Add person popover to notes/alerts
- [x] Optimize deduplication (@fiatjaf)
- [x] Add image uploads to profile and new post
- [x] Fix parsing kind 3 relays
- [x] Fix some display bugs
- [x] Rename inbox to notifications

## 0.2.13

- [x] Remove popular tab, add follows feed back in
- [x] Fix a bunch of bugs
- [x] Improve error redaction
- [x] Improve performance by timing out parents check
- [x] Speed up query for routes to avoid ui freeze
- [x] Re-write alerts to improve reliability and completeness
- [x] Fix clickability of toast
- [x] Speed up database restore/drop by lumping tables into a single key
- [x] Fix user display in mentions
- [x] Improve login when profile isn't found to avoid stomping user relay settings
- [x] Improve pagination using a reactive offset
- [x] Hide replies based on muffle
- [x] Add relay detail page with contact info, and global feed
- [x] Split chat and DMs into two separate sections
- [x] Add DM requests as a separate tab
- [x] Add mentions to alerts

## 0.2.12

- [x] Stream likes and replies in lazily
- [x] Add relay symbol to notes which is clickable to view relays
- [x] Switch to publishing events optimistically
- [x] Reduce how many relays replies are published to
- [x] Re-work thread layout
- [x] Color code relays
- [x] Show relay status based on stats not current connection status
- [x] Auto-mention person when creating a note from their profile page
- [x] Make chat header overlap main header to save space
- [x] Strip formatting when pasting into Compose
- [x] Upgraded nostr-tools to 1.4.1
- [x] Improve anonymous and new user experience by prompting for relays and follows
- [x] Fixed kind0 merging to avoid dropping properties coracle doesn't support
- [x] Implement NIP-65 properly
- [x] Allow users to set max number of concurrent relays

## 0.2.11

- [x] Converted threshold to percentage
- [x] Fixed slow leaving/joining chat rooms
- [x] Switch to localforage from dexie, fixing firefox/safari private windows
- [x] Tweaks to link parsing
- [x] Use write relays to publish events more intelligently
- [x] Add followers/follows lists

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
