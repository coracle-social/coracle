# Changelog

# 0.3.7

- [x] Add ToS and Privacy Policy
- [x] Use an ephemeral key when reporting content and expire reports
- [x] Fix message ordering
- [x] Add local relay
- [x] Reduce wait time for person feeds
- [x] Add global music player
- [x] Support bech32 entities in long form content
- [x] Add support for profile website
- [x] Speed up reaction/reply loading
- [x] Add content-warning support
- [x] Link to github for feedback
- [x] Fix chat room joined status
- [x] Fix list deletion
- [x] Reduce repeated notes in feeds
- [x] Add database import/export
- [x] Use a bloom filter for deletes

# 0.3.6

- [x] Add support for kind 1808

# 0.3.5

- [x] Fix scrambled person list
- [x] Add NIP-32 labeling for events
- [x] Add Explore tab which surfaces labels from your follows list
- [x] Add NIP-36 reports
- [x] Fix zaps bug
- [x] Fix person info relays

# 0.3.4

- [x] Switch to nostr.build for image hosting
- [x] Fix url placement in non-empty text box
- [x] Stop sending invalid search requests
- [x] Stop loading new notes automatically
- [x] Refactor gift wrap stuff in preparation for extension support
- [x] Optimize store.notify
- [x] Add field components
- [x] Fix spotify album embed
- [x] Broadcast note button
- [x] Open person detail on notification detail
- [x] Clean up info modals

# 0.3.3

- [x] Add ability to start a chat from the messages list page (NIP 24 only)
- [x] Move notification info to modal
- [x] Fix relay selection sorting
- [x] Limit concurrent subscriptions
- [x] Re-introduce shuffle+slice of authors
- [x] Re-connect to sockets with an error after a while
- [x] Re-write connection management entirely
- [x] Fix memory leak in context loader
- [x] Fix loading new notes on feeds
- [x] Fix anonymous chat list
- [x] Fine tune relay hints
- [x] Add support for displaying kinds 30009 and 31337
- [x] Add support for spotify embeds
- [x] Add about page with links and donations/support
- [x] Reduce number of duplicate notes in feeds

# 0.3.2

- [x] Prototype implementation of NIP 24 encrypted chat

# 0.3.1

- [x] Fix not loading parents from non-followed accounts
- [x] Load search results from network on mention suggestions
- [x] Add log in as user
- [x] Add multi-account support
- [x] Remove authors limit of 256
- [x] Improve relay hints and selection

# 0.3.0

- [x] Faster login and initial load
- [x] Faster and more complete feed loading
- [x] More bandwidth-sensitive notifications fetching
- [x] Fewer missing profile badges
- [x] Use NIP 89 for app recommendations
- [x] Add support for kinds filter in advanced search
- [x] Add support for displaying kinds 0, 3, 10002
- [x] Add detailed summary of relays a note was published to
- [x] Emphasize follow status instead of nip05 addresses
- [x] Add image uploads to chat
- [x] Add new thread view
- [x] Removed profile popover, click on a person's name to find mute and follow buttons
- [x] Add configurable imgproxy url
- [x] Show hover state on icon buttons
- [x] Re-work navigation, put search in nav
- [x] Add word count to new note
- [x] Add support for attaching multiple images to a note
- [x] Fix note parsing when parentheses are involved
- [x] Fix person detail layout on small screens
- [x] Fix chat/dm header
- [x] Fix lots of bugs

# 0.2.35

- [x] Add support for nsecbunker
- [x] Switch from npm to yarn
- [x] Upgrade nostr-tools, svelte-routing

# 0.2.34

- [x] Fix mentions on Safari
- [x] Fix quoted 30023 events
- [x] Fix Safari performance issues
- [x] Small note display bugfixes
- [x] Fix inability to publish on first signup

# 0.2.33

- [x] Add rendering support for kind 1985 (labels and reviews)
- [x] Add rendering support for kind 9802 (highlights)
- [x] Add rendering support for kind 1063 (image header)
- [x] Add rendering support for kind 30023 (long form content)

# 0.2.32

- [x] Add note preview when composing
- [x] Merge advanced search, feed options, and lists
- [x] Fix loading lists on login
- [x] Improve anonymous user UX

# 0.2.31

- [x] Add the ability to view and write reviews on relays, with ratings
- [x] Add support for parsing and displaying lnurl invoices
- [x] Add advanced search to feeds with a summary of the filter applied
- [x] Improve url parsing
- [x] Reduce threshold for fuzzy search

# 0.2.30

- [x] Prefer followed users when mentioning people
- [x] Open people in a modal when it makes sense
- [x] Fix regex for urls
- [x] Fix note sharing bug
- [x] Add mention mark to e tags embedded in notes
- [x] Add tags to notes by parsing content
- [x] Add note delete button
- [x] Add mentions to quotes
- [x] Increase routes table size and change sort order to hopefully get better relay hints
- [x] Upgrade mentions from square bracket notation to bech32 embeds

# 0.2.29

- [x] Register url handler for web+nostr and use that for sharing
- [x] Combine search and scan pages
- [x] Clean up notifications page
- [x] Add note share page

# 0.2.28

- [x] Add basic naddr support
- [x] Add scroll to top button, and scroll to top on navigate
- [x] Add close all button to modal, open person in modal more often
- [x] Fix legacy e tag parsing

# 0.2.27

- [x] Fix mention notifications
- [x] Make relay urls readable on relay browsing page (@fiatjaf)
- [x] When publishing to a single relay, display its name (@fiatjaf)
- [x] Default new notes to a single relay when viewing a relay's feed (@fiatjaf)
- [x] Use smaller max depth on note detail

# 0.2.26

- [x] Fix hanging feeds after a few pages
- [x] Fix huge QR codes for profile sharing
- [x] Improve relay hints
- [x] Fix last_checked corruption

# 0.2.25

- [x] Add purplepag.es to sign in flow to speed things up
- [x] Include people with only a display_name in search
- [x] Fix AUTH over multiplextr
- [x] Remember whether messages/notifications have been read
- [x] Remember chat membership
- [x] Add new cursor implementation to paginate relays independently
- [x] Fix lists selector
- [x] Simplify theme configuration
- [x] Add profile info and first note to onboarding
- [x] Make app name configurable
- [x] Improve forced-relay experience
- [x] Add env var for disabling zaps
- [x] Split notifications into multiple tabs
- [x] Improve modal stacking
- [x] Render quotes inline rather than at the bottom of the note

## 0.2.24

- [x] Replace localforage with loki.js for storage
- [x] Fix a bunch of bugs in content parsing
- [x] Add lists/custom feeds
- [x] Refactor component hiararchy
- [x] Re-work how modals stack
- [x] Enqueue context requests to reduce number of concurrent subscriptions
- [x] Use NIP-50 search to populate search results
- [x] Persist settings to nostr using NIP-78

## 0.2.23

- [x] Fix modal scroll position for nested modals
- [x] Fix memory leak in pool.subscribe
- [x] Use relays specified in bech32 entities
- [x] Add colored relay indicator to notes
- [x] Add relay-filtered overlay dialog to feeds
- [x] Improve relay detail header

## 0.2.22

- [x] Add ability to collapse threads
- [x] Add titles to overflow menu on note detail
- [x] Re-work streamContext to keep listening for updates
- [x] Render notes within notifications properly
- [x] Remove flag reactions, since they're somewhat redundant with mutes
- [x] Generally improve UI consistency and feel
- [x] Add event id, likers, and zappers to note info popover
- [x] Mutate seen_on to show all relays a given note was found on

## 0.2.21

- [x] Fix AUTH support
- [x] Add note quotes
- [x] Add support for bech32 entity rendering and parsing
- [x] Show all images/links in modal dialog
- [x] Fix newline handling in note composition
- [x] Render links in person.about content
- [x] Fix person detail relays list
- [x] Show username when creating a note

## 0.2.20

- [x] Re-write pool to use paravel
- [x] Add support for multiplextr
- [x] Fix retrieving old chat/DM messages
- [x] Disable self-zap

## 0.2.19

Maintenance release - bugfixes, style fixes, and refactoring. High points are AUTH support, and much improved note composition/mention interpolation.

- [x] Add confirmation to zap dialog
- [x] Avoid pruning profiles we know we'll use more often
- [x] Re-write pool to remove dependency on nostr-tools.relay
- [x] Add support for AUTH
- [x] Use COUNT for counting follows
- [x] Re-write note composition input
- [x] Add since to feeds to improve time relevance
- [x] Fix a few styling things

## 0.2.18

- [x] Re-write data storage layer to conserve memory using a custom LRU cache
- [x] Fix bugs with handling invalid keys
- [x] Improve pubkey/anonymous login
- [x] Generate placeholder profile images (@morkowski)
- [x] Fix notifications to more complete and reliable
- [x] Update license back to MIT. Enjoy!

## 0.2.17

- [x] Make "show new notes" button fixed position
- [x] Gray out buttons that don't work when logged in with pubkey
- [x] Clean up popovers, re-design notes on small screens
- [x] Migrate muffle to mute, add thread muting

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
