# Changelog

# 0.6.30

* Add video thumbnails

# 0.6.29

* Show topics/comment on highlights
* Update default relays
* Update to new welshman version
* Add list nav item
* Remove glitchtip

# 0.6.28

* Fix topic feeds
* Fix images when imgproxy is disabled

# 0.6.27

* Fix imgproxy urls
* Don't linkify non-link highlight sources
* Fix a typo

# 0.6.26

* Be more permissive when parsing nip 05s
* Stop publishing notes with e-tag `mention` markers
* Improve performance
* Fix help link
* Bring global feeds back
* Improve negentropy support

# 0.6.25

* Show a tags on highlights
* Disable imgproxy by default

# 0.6.24

* Use new shipyard pubkey
* Small optimizations

# 0.6.23

* Show loading when following/unfollowing
* Add relay fallback to zaps

# 0.6.22

* Support clicks on images in long form content
* Restore draft when aborting reply

# 0.6.20

* Fix duplicate follow actions in onboarding
* Fix feed controls changing themselves
* Fix long form topic chips
* Remove global feeds
* Only count non-muted events in reply count
* Improve zap receipt fetching
* Fix "show anyway" button opening a drawer
* Fix scroll bug

# 0.6.19

* Improve relay hint reliability
* Enable DMs on conversation link
* Improve feed parent fetching
* Remove profile banners
* Add better mute support
* Mute privately by default
* Broadcast user relays when publishing
* Aggresively refresh user data before updating to reduce race conditions
* Add NWC wallet management
* Re-work zaps

# 0.6.18

* Fix a few small bugs with initial content on note creation
* Fix NIP 05 validation
* Show profile json on person info

# 0.6.17

* Fix reaction notifications crash
* Show web of trust badge on DM items
* Make name on messages clickable
* Reduce duplicate dependencies
* Add relays to note options form

# 0.6.16

* Add support for editing WOT feeds
* Change default blossom servers
* Add support for custom emojis
* Fix note deduplication

# 0.6.15

* Fix safe areas more
* Improve remote signing
* Drop nip 96 support
* Use user blossom servers
* Improve profile edit page
* Avoid duplicate notes in feeds

# 0.6.14

* Fix safe areas

# 0.6.13

* Add safe areas

# 0.6.12

* Upgrade capacitor
* Fix mini modals on small screens
* Allow use of ws:// relays on android
* Fix database exports on android
* Fix blog posts with naddrs

# 0.6.11

* Fix draft restoration bugs
* Improve NIP 22 comment support

# 0.6.10

* Fix spotify url parsing bug
* Fix nip46 signer connect
* Use new version of network library
* Fix reply drafts bug
* Fix creating a new account while logged in
* Re-work storage adapter to minimize storage and improve performance
* Improve initial page load times
* Fix followers page
* Upgrade welshman
* Remove platform relay
* Show PoW
* Don't fetch messages until decryption is enabled

# 0.6.9

* Fix collection loading
* Fix image paste uploading
* Quote addressable events by address rather than nevent
* Bump nostr-tools to fix nostrcheck uploads
* Show error when DM fails to send

# 0.6.8

* Correctly fetch and render NIP 22 comments

# 0.6.7

* Add note info to DMs
* Make lnurl parsing more robust

# 0.6.6

* Show complete website/lnurl
* Scan images for sensitive content
* Make muting on feeds more strict
* Apply muted words to nip05
* Fix list editing

# 0.6.5

* Fix memory leak
* Fix isEventMuted
* Fix toast animation
* Fix (and improve) drafts
* Fix parser dropping sections of notes

# 0.6.4

* Make event details json nicer
* Fix shimmer placeholder

# 0.6.3

* Go back to strict mute application in feeds

# 0.6.2

* Prevent notes from opening when links are clicked

# 0.6.1

* Use wasted space on mobile notes
* Fix images/link behavior on mobile
* Show PoW difficulty in settings
* Fix WoT filter not getting applied

# 0.6.0

Contributors: @hodlbod, @dtonon, @thibaut

* Add support for tor/local relays
* Use nstart for onboarding process
* Oranize media into grids and add full-screen overlay view for images
* Fix several note editor bugs
* Improve thread, profile page, and notification loading
* Show more details on reaction notifications
* Improve mutes, add setting to completely hide muted people
* Tweak long form article rendering
* Refactor zap dialog
* Add kind 20 rendering support
* Improve rendering for various note kinds
* Use more subtle placeholder avatar
* Fix handling of all-caps lnurls
* Fix rendering of notes in publish information dialog
* Add pinned note support
* Remove broadcasting of note parents
* Add note scheduling via DVM
* Clean up modal colors and design
* Add PoW generation and filtering

# 0.5.0

Contributors: @hodlbod, @dtonon, @thibaut

* Re-design relay cards
* Fix hud publish status
* Default to dark theme
* Fix loading inbox relay selections
* Re-work onboarding
* Fix timeouts for subscriptions
* Stop storing ephemeral events in local relay
* Limit created_at feed editing to absolute dates
* Fix caching bug, improving performance
* Use custom throttle function, improving performance
* Improve direct message sending UX
* Make follower count reactive
* Improve HUD to include connection stats and searchable notices
* Disable some navigation items for non-users
* Re-design feed selector interface
* Add suggestions for hashtags
* Improve relay feed support
* Add nostr: prefix to entities
* Make inbox relay warnings more prominent
* Use nostr-editor to power note composition dialog
* Add delay-based undo for note creation and replies
* Remove groups, markets, calendars
* Fix missing replies in notifications
* Allow deleting feeds from the feed edit dialog
* Show error on failed zap
* Improve gift-wrap unwrapping
* Remove support for sending nip04 messages
* Improve quote relay selection
* Add blossom support with configurable servers
* Re-write feed loader
* Re-write relay selection logic
* Add icon to apk

# 0.4.16

Contributors: @hodlbod, @dtonon, @thibaut

* Add richer description in wot popover
* Use new nip46 implementation, re-design login experience

# 0.4.15

* Hack in accommodation of algorithmic relay feeds
* Fix some bugs related to auth and data storage
* Downgrade typescript to save my sanity
* Show links/images as blocks when at the end of a paragraph
* Implement new profile page and summary designs
* Stop sending user to bugsnag

# 0.4.14

* Fix some bugs related to message discovery

# 0.4.13

* Add support for nip05 urls
* Re-work notification rendering and loading
* Fix slight NIP 17 incompatibility with 0xChat DMs/group chats
* Use Intl api for list formatting (zmjohnson)
* Update nostr signer version to support app icon url (chebizarro)

# 0.4.12

* Fix zap developer button
* Hide wot muted replies
* Conserve space on mobile
* Show mark as read button on mobile
* Fix reposts to communities
* Fix note tag inheritance
* Fix over-eager list encryption

# 0.4.11

* Add NIP 55 support to Android
* Add negentropy support
* Simplify sync for messages, groups, and notifications
* Small UI fixes

# 0.4.10

* Show loading when sending note reply
* Support rendering zap responses
* Speed up web of trust calculation and search page
* Reduce extra encrypt/decrypt calls when updating lists
* Apply mute keywords to usernames as well as note content
* Large refactor to use @welshman/app utilities
* Add profile picture to DMs
* Add pubkey to profile name, fix wot info on mobile (zmjohnson)
* Render highlight comments
* Improve initial load and search performance
* Remove web of trust numbers

# 0.4.9

* Add person zaps
* Bring back delete
* Fix group notifications
* Add group feeds
* Improve NIP 17 UX
* Include signature in event json
* Use new read status NIP
* Simplify wot calculation
* Add ncryptsec support (notbiebs)
* Add alt tag to feeds and lists

# 0.4.8

* Add support for kind 10050 relay lists
* Toggle nip44 messages based on 10050 signaling
* Fix settings being stale until reload
* Fix WoT not being applied to mute replies
* Add developer donation prompt
* Add WoT information to feed cards and search
* Fix group updates not getting saved
* Add relay hints to group/community tags

# 0.4.7

* Show toast when offline
* Use new indexeddb wrapper
* Add `k` tag to deletions
* Allow users to choose where to publish their profile when using a white-labeled instance
* Add "open with" link populated by nip 89 handlers
* Fix several community and calendar related bugs
* Add reports using tagr-bot
* Open links to coracle in same tab
* Add global feeds
* Add feed favorites

# 0.4.6

* Improve search results loading indicator
* Make zaps prettier with bitcoin-connect
* Improve DM loading and deliverability
* Add ability to search other people's lists and feeds
* Limit recursive quotes
* Derive profiles, relay selections, follows, and mutes from event repository
* Use new welshman content parser
* Remember nip04/44 preference per conversation
* Fix some help links
* Improve feed loading speed, avoid prioritizing cached results
* Include more results in suggestions
* Avoid requesting zaps a zillion times

# 0.4.5

* Accept npubs in people input
* Skip notifying admin when the person joining/leaving groups is the admin
* Remove group share modal, skip straight to create invite link
* Rank groups by WoT
* Fix subtle navigation bugs
* Show a little more metadata on relay card
* Make groups deletable
* Use new utility libraries
* Fix network filter
* Refactor subscribe/load
* Switch to chips for relay controls for more granularity
* Fix group search
* Join invite relays in background during onboarding
* Republish user profile data when joining a new relay
* Create new note publish status HUD
* Add wallet setup onboarding item
* Remember theme after logging out
* Collapse apps in note details modal
* Add custom feeds
* Introduce new in-memory relay
* Re-work feed controls
* Re-work utility library
* Make buttons, chips, and inputs sleeker
* Clean up onboarding with an invite
* Only tag parent event in reactions
* Fix url hashes, render code blocks
* Use bitcoin connect instead of webln
* Fix double submit on group create dialog
* Add mentions to note info dialog

# 0.4.4

* Format time and date based on browser regional settings
* Rename `FORCE_RELAYS` to `PLATFORM_RELAYS`
* Stop reading kind 3 relays
* Publish q tags
* Add sugggested relays based on follows
* Improve invite creation
* Added docker image (@kornpow)
* Code split by route
* Add fixed footer for settings forms
* Add claim query param to group detail
* Add admin key import
* Improve hashtag regex (@zen)
* Add rendering support for cashu tokens


# 0.4.3

* Add follow all to onboarding topics
* Add FORCE_RELAYS environment variable
* Add support for extensions that implement nip44
* Add zap splits
* Add default platform split amount
* Add invite link generation
* Use new web of trust display
* Show loading when searching profiles
* Apply new note styles and theme
* Redirect to onboarding from invite link if no user
* Fix legacy messages

# 0.4.2

* Require signer on some routes
* Add group notes to group notifications
* Add badges to all notification page tabs
* Use better search algorithm and show loaded profiles in global search
* Improve group invite deliverability
* Add nostr connect support
* Re-work onboarding entirely
* Fix some list-related bugs
* Migrate lists from `name` to `title`
* Add list `description`
* Skip confirm on logout
* Add initial onboarding notification to back up keys

# 0.4.1

* Fix pubkey display in PersonAbout
* Hide deleted calendar events
* Show date on calendar event notes
* Add edit for calendar events
* Add delete for calendar events
* Fix word count on mobile
* Fix search results opening twice
* Fix list edit
* Expand notes inline when clicking "Show More"
* Refresh pages when navigating to the current page
* Remove duplicate media from listings
* Add listing edit and delete
* Navigate to notes by address when possible
* Remove query string from imgproxy payload
* Remove duplicates by address from feeds
* Add mention action to person detail page
* Fix replies not showing right away
* Scroll to top on navigate
* Support read receipts for notifications
* Fix conversations view when logged in with multiple accounts
* Add status to listings
* Fix initial message when opening conversation from a listing
* Support frequency value in `price` tag for nip 99
* Show all replies expands notes inline rather than opening the note
* Fix nip04 messages not having a members field
* Improve person search
* Fix zaps in private groups
* Improve relay selection for groups
* Fix DM compatibility UX
* Keep relays intact when publishing kind 3

# 0.4.0

* Add NIP 44 encryption support
* Add NIP 24 chat support with NIP 04 backwards compatibility
* Add NIP 72 community support
* Add NIP 87 closed community support
* Add NIP 51 calendar event support
* Add NIP 99 classifieds support
* Support cross-posting
* Limit number of replies shown on feed
* Search results sorted by relevance weighted by WoT
* Add anonymous zaps
* Strip hash from media urls
* Start on @daniele's redesign
* Add bitcoin connect support
* Remove Apps page, move NIP 89 support to note info dialog
* Publish NIP 89 client tag
* Remove Explore page, move NIP 32 support to profile collections
* Replaced `FORCE_RELAYS` env variable with `FORCE_GROUP`
* Warn when a user might be publishing their nsec

# 0.3.14

* Remove sliders icon, add plus button next to pills instead
* NIP 52 time-based calendar events publish/render
* NIP 99 classifieds publish/render
* Add support for bunker:// (@brugeman)
* Improve theme switching reactivity
* Re-work replies, note rendering, and feed controls
* Speed up login
* Better a-tag reply support

# 0.3.13

* Update lists to use new 30003 user bookmarks kind
* Add NIP 96 file storage (thanks to @quentintaranpino)
* Add NIP 98 auth support (thanks to @quentintaranpino)
* Add DIP 01 imeta tag creation
* Re-work keys page, include group keys
* Add anonymous posting
* Add note options dialog to replies
* Add support for reposts and cross-posts
* Bump paravel to fix missing tags after normalize (fixes mention notifications)
* Fix throttled notifications derive loop
* Conservatively load from cache when on a slow network
* Add refresh button to feeds
* Add image previews to note reply

# 0.3.12

* Add support for kind 30311 (streams)
* Fix DM message sizing and layout
* Fix bug with relay limit mutable state
* Open relay detail page for relay links in content
* Include mutes in WoT score calculation
* Fix explore/label detail pages
* Add setting to disable likes/reactions
* Move some utilities to paravel
* Add experimental DVM code
* Disable NIP 24 messages for now
* Use NIP 85 for relay reviews
* Improve feed controls UX
* Add rendering support for kind 1986
* Fix publish failure detection

# 0.3.11

* Re-write routing to make modal links persistent and handle history better
* Handle a tag replies
* Fix feed search
* Simplify card theme using css
* Fix notification badge for non-accepted conversations
* Add WoT help information
* Add WoT threshold setting
* Show relays in feed controls
* Exclude angle brackets from url regex
* Fix double modal close bug on double click/esc
* Show local relay dot if note is loaded from cache
* Tighten up note actions on mobile
* Don't show cached notes on relay-specific feeds
* Allow copying note text without opening the note
* Support cmd+click of certain links
* Add show/hide replies toggle to feeds
* Don't ruin gifs and webp uploads
* Normalize urls more robustly
* Add back button to onboarding steps
* Fix load grouping to split limited loads out
* Fix load to actually return events
* Allow showing hidden replies
* Add 32123 support to notes and music player
* Add support for zap splits (wavlake version only)
* Encode relays into urls when possible
* Opt-in to local relay when it's actually useful
* Fix link overflow when media previews are off
* Speed things up by using animations more sparingly
* Fix DM view scrolling and formatting of messages with links

# 0.3.10

* Use local relay on all requests
* Use filters to control which replies are shown
* Fix nasty bug where combined requests would prevent each other from receiving events. This will fix threads and notifications frequently not loading.
* Clean up note component, particulary context sharing
* Add LRU cache for verifySignature to reduce load on CPU
* Group notifications by 3 hour chunks
* Fix guessFilterDelta
* Sign NIP 98 upload header

# 0.3.9

* Close stale connections to prevent stalling
* Fix onboarding profile picture upload
* Batch zapper/handle requests
* Fix invalid id filters
* Mute DMs from muted accounts
* Add better date picker
* Reduce redundant nip05 calls
* Reduce redundant signature verification
* Show how many people you follow follow someone you don't follow
* Improve and optimize followers count
* Show warning next to possible imposters
* Switch font to Lato
* Fix anonymous relay usage

# 0.3.8

* Show reply immediately after sending
* Fix relay detail page
* Improve up music, quote, and old note loading
* Show more information on notifications page, particularly for mentions
* Fix message tabs and message sync tracking
* Remove nip28 chat
* Fix crash on apps page
* Segregate messages and sync timestamps by session for multiple accounts
* Group notifications by hour instead of day
* Don't mute the user's own notes
* Stop propagation when clicking links
* Fix out of date derived stores

# 0.3.7

* Add ToS and Privacy Policy
* Use an ephemeral key when reporting content and expire reports
* Fix message ordering
* Add local relay
* Reduce wait time for person feeds
* Add global music player
* Support bech32 entities in long form content
* Add support for profile website
* Speed up reaction/reply loading
* Add content-warning support
* Link to github for feedback
* Fix chat room joined status
* Fix list deletion
* Reduce repeated notes in feeds
* Add database import/export
* Use a bloom filter for deletes
* Remember reply drafts
* Topic/keyword mutes
* Add person mute list to settings
* Split out content settings into its own page
* Improve quote loading
* Show quotes even when media previews are off
* Stop cursor events when menu is open
* Restore document title on back

# 0.3.6

* Add support for kind 1808

# 0.3.5

* Fix scrambled person list
* Add NIP-32 labeling for events
* Add Explore tab which surfaces labels from your follows list
* Add NIP-36 reports
* Fix zaps bug
* Fix person info relays

# 0.3.4

* Switch to nostr.build for image hosting
* Fix url placement in non-empty text box
* Stop sending invalid search requests
* Stop loading new notes automatically
* Refactor gift wrap stuff in preparation for extension support
* Optimize store.notify
* Add field components
* Fix spotify album embed
* Broadcast note button
* Open person detail on notification detail
* Clean up info modals

# 0.3.3

* Add ability to start a chat from the messages list page (NIP 24 only)
* Move notification info to modal
* Fix relay selection sorting
* Limit concurrent subscriptions
* Re-introduce shuffle+slice of authors
* Re-connect to sockets with an error after a while
* Re-write connection management entirely
* Fix memory leak in context loader
* Fix loading new notes on feeds
* Fix anonymous chat list
* Fine tune relay hints
* Add support for displaying kinds 30009 and 31337
* Add support for spotify embeds
* Add about page with links and donations/support
* Reduce number of duplicate notes in feeds

# 0.3.2

* Prototype implementation of NIP 24 encrypted chat

# 0.3.1

* Fix not loading parents from non-followed accounts
* Load search results from network on mention suggestions
* Add log in as user
* Add multi-account support
* Remove authors limit of 256
* Improve relay hints and selection

# 0.3.0

* Faster login and initial load
* Faster and more complete feed loading
* More bandwidth-sensitive notifications fetching
* Fewer missing profile badges
* Use NIP 89 for app recommendations
* Add support for kinds filter in advanced search
* Add support for displaying kinds 0, 3, 10002
* Add detailed summary of relays a note was published to
* Emphasize follow status instead of nip05 addresses
* Add image uploads to chat
* Add new thread view
* Removed profile popover, click on a person's name to find mute and follow buttons
* Add configurable imgproxy url
* Show hover state on icon buttons
* Re-work navigation, put search in nav
* Add word count to new note
* Add support for attaching multiple images to a note
* Fix note parsing when parentheses are involved
* Fix person detail layout on small screens
* Fix chat/dm header
* Fix lots of bugs

# 0.2.35

* Add support for nsecbunker
* Switch from npm to yarn
* Upgrade nostr-tools, svelte-routing

# 0.2.34

* Fix mentions on Safari
* Fix quoted 30023 events
* Fix Safari performance issues
* Small note display bugfixes
* Fix inability to publish on first signup

# 0.2.33

* Add rendering support for kind 1985 (labels and reviews)
* Add rendering support for kind 9802 (highlights)
* Add rendering support for kind 1063 (image header)
* Add rendering support for kind 30023 (long form content)

# 0.2.32

* Add note preview when composing
* Merge advanced search, feed options, and lists
* Fix loading lists on login
* Improve anonymous user UX

# 0.2.31

* Add the ability to view and write reviews on relays, with ratings
* Add support for parsing and displaying lnurl invoices
* Add advanced search to feeds with a summary of the filter applied
* Improve url parsing
* Reduce threshold for fuzzy search

# 0.2.30

* Prefer followed users when mentioning people
* Open people in a modal when it makes sense
* Fix regex for urls
* Fix note sharing bug
* Add mention mark to e tags embedded in notes
* Add tags to notes by parsing content
* Add note delete button
* Add mentions to quotes
* Increase routes table size and change sort order to hopefully get better relay hints
* Upgrade mentions from square bracket notation to bech32 embeds

# 0.2.29

* Register url handler for web+nostr and use that for sharing
* Combine search and scan pages
* Clean up notifications page
* Add note share page

# 0.2.28

* Add basic naddr support
* Add scroll to top button, and scroll to top on navigate
* Add close all button to modal, open person in modal more often
* Fix legacy e tag parsing

# 0.2.27

* Fix mention notifications
* Make relay urls readable on relay browsing page (@fiatjaf)
* When publishing to a single relay, display its name (@fiatjaf)
* Default new notes to a single relay when viewing a relay's feed (@fiatjaf)
* Use smaller max depth on note detail

# 0.2.26

* Fix hanging feeds after a few pages
* Fix huge QR codes for profile sharing
* Improve relay hints
* Fix last_checked corruption

# 0.2.25

* Add purplepag.es to sign in flow to speed things up
* Include people with only a display_name in search
* Fix AUTH over multiplextr
* Remember whether messages/notifications have been read
* Remember chat membership
* Add new cursor implementation to paginate relays independently
* Fix lists selector
* Simplify theme configuration
* Add profile info and first note to onboarding
* Make app name configurable
* Improve forced-relay experience
* Add env var for disabling zaps
* Split notifications into multiple tabs
* Improve modal stacking
* Render quotes inline rather than at the bottom of the note

## 0.2.24

* Replace localforage with loki.js for storage
* Fix a bunch of bugs in content parsing
* Add lists/custom feeds
* Refactor component hiararchy
* Re-work how modals stack
* Enqueue context requests to reduce number of concurrent subscriptions
* Use NIP-50 search to populate search results
* Persist settings to nostr using NIP-78

## 0.2.23

* Fix modal scroll position for nested modals
* Fix memory leak in pool.subscribe
* Use relays specified in bech32 entities
* Add colored relay indicator to notes
* Add relay-filtered overlay dialog to feeds
* Improve relay detail header

## 0.2.22

* Add ability to collapse threads
* Add titles to overflow menu on note detail
* Re-work streamContext to keep listening for updates
* Render notes within notifications properly
* Remove flag reactions, since they're somewhat redundant with mutes
* Generally improve UI consistency and feel
* Add event id, likers, and zappers to note info popover
* Mutate seen_on to show all relays a given note was found on

## 0.2.21

* Fix AUTH support
* Add note quotes
* Add support for bech32 entity rendering and parsing
* Show all images/links in modal dialog
* Fix newline handling in note composition
* Render links in person.about content
* Fix person detail relays list
* Show username when creating a note

## 0.2.20

* Re-write pool to use paravel
* Add support for multiplextr
* Fix retrieving old chat/DM messages
* Disable self-zap

## 0.2.19

Maintenance release - bugfixes, style fixes, and refactoring. High points are AUTH support, and much improved note composition/mention interpolation.

* Add confirmation to zap dialog
* Avoid pruning profiles we know we'll use more often
* Re-write pool to remove dependency on nostr-tools.relay
* Add support for AUTH
* Use COUNT for counting follows
* Re-write note composition input
* Add since to feeds to improve time relevance
* Fix a few styling things

## 0.2.18

* Re-write data storage layer to conserve memory using a custom LRU cache
* Fix bugs with handling invalid keys
* Improve pubkey/anonymous login
* Generate placeholder profile images (@morkowski)
* Fix notifications to more complete and reliable
* Update license back to MIT. Enjoy!

## 0.2.17

* Make "show new notes" button fixed position
* Gray out buttons that don't work when logged in with pubkey
* Clean up popovers, re-design notes on small screens
* Migrate muffle to mute, add thread muting

## 0.2.16

* Add search by nip05 (@fiatjaf)
* Fix feed to show more variety
* Beautify notes, modals, reaction buttons
* Add uploads to replies
* Sort replies descending
* Add prettier for formatting
* Refine feed loading to prevent hanging or missing content
* Add new onboarding workflow
* Fix various bugs related to zaps (@fiatjaf)
* Fix horizontal scrolling on profile page (@morkowski)
* Update README with instructions for running manually (@gourcetools)
* Add profile info modal to profile view (@igmaat)
* Optimize event deduplication (@fiatjaf)
* Clean up QR codes
* Give cards a slight border
* Tweak background for image mat
* Set route name to document title

## 0.2.15

* Add zaps

## 0.2.14

* Improve paste support
* Add timestamps to messages
* Support installation as a PWA
* Fix social share image, add description
* Clean up person detail actions, maybe click one circle and show the rest
* Add person popover to notes/alerts
* Optimize deduplication (@fiatjaf)
* Add image uploads to profile and new post
* Fix parsing kind 3 relays
* Fix some display bugs
* Rename inbox to notifications

## 0.2.13

* Remove popular tab, add follows feed back in
* Fix a bunch of bugs
* Improve error redaction
* Improve performance by timing out parents check
* Speed up query for routes to avoid ui freeze
* Re-write alerts to improve reliability and completeness
* Fix clickability of toast
* Speed up database restore/drop by lumping tables into a single key
* Fix user display in mentions
* Improve login when profile isn't found to avoid stomping user relay settings
* Improve pagination using a reactive offset
* Hide replies based on muffle
* Add relay detail page with contact info, and global feed
* Split chat and DMs into two separate sections
* Add DM requests as a separate tab
* Add mentions to alerts

## 0.2.12

* Stream likes and replies in lazily
* Add relay symbol to notes which is clickable to view relays
* Switch to publishing events optimistically
* Reduce how many relays replies are published to
* Re-work thread layout
* Color code relays
* Show relay status based on stats not current connection status
* Auto-mention person when creating a note from their profile page
* Make chat header overlap main header to save space
* Strip formatting when pasting into EditorContent
* Upgraded nostr-tools to 1.4.1
* Improve anonymous and new user experience by prompting for relays and follows
* Fixed kind0 merging to avoid dropping properties coracle doesn't support
* Implement NIP-65 properly
* Allow users to set max number of concurrent relays

## 0.2.11

* Converted threshold to percentage
* Fixed slow leaving/joining chat rooms
* Switch to localforage from dexie, fixing firefox/safari private windows
* Tweaks to link parsing
* Use write relays to publish events more intelligently
* Add followers/follows lists

## 0.2.10

* Fixed likes not showing up in alerts
* Raised threshold for pool to 2 so we don't have such a small amount of results
* Wait for profile info on login, navigate to network by default
* Fix mention selection, inheritance, and inclusion in notes
* Parse links without http at the beginning
* Clean up back button in combination with modals
* Re-design relays page and person relays list with metadata
* Add relay selection to new note screen

## 0.2.9

* Fixed a bug in pool.subscribe which was causing requests to wait for all connections
* Added typescript with pre-commit hook
* Fixed layout for chat, person pages
* Parse relays for kind 3

## 0.2.8

* Stop showing replies at top level in feeds to make it more interesting
* Fix a bug that was preventing people from sending a message
* Stop sending IP addresses to bugsnag
* Fix some layout bugs

## 0.2.7

* Added direct messages and group chat
* Sped up feeds by requesting less context
* Sped up alerts by storing them in dexie
* Fixed feeds so they don't jump around
* Switched from time-based to limit-based cursors
* Added batching for note context to speed things up
* Fixed support for old-style reply identification
* Improved reliability of event retrieval by following relay hints
* Added default petnames and relays
* Added support for user banners
* Added recommended relay to tags
* Added topics to note composition
* Added a way to remove mentions from replies
* Coracle now publishes user relays using kind 10001 per NIP 23
* Menu now stays open on larger screens
* Standardized some layout components
* Added support for profile banner images
* Support connection status/speed indication on relays
* Add toggle to enable writing to a connected relay
* Re-designed login and relay pages
* Use private key login only if extension is not enabled
* Add pubkey login support
* Removed dexie for most things
* Added support for bech32 entities
* Auto-disconnect/reconnect to spare relay resources
* Added automatic relay discovery
* Added error tracking with bugsnag
* Upgraded nostr-tools
* Added support for NIP-05 verfication
* Added analytics and error reporting (opt out supported)

## 0.2.6

* Add support for at-mentions in note and reply composition
* Improve cleanup on logout
* Move add note button to be available everywhere
* Fix reporting relay along with tags
* Add support for bech32 keys
* Add second order follows to network tab
* Add favicon and social media preview image
* Extract urls in person bios
* Add follow/follower counts

## 0.2.5

* Batch load context for feeds

## 0.2.4

* Fix reactions - livequery is required in order to listen for changes

## 0.2.3

* Fix reactions - we'll show new reactions optimistically to avoid complexity in listeners

## 0.2.2

* Show notification for new notes rather than automatically adding them to the feed
* Improve slow relay pruning by using a timeout for each relay
* Re-work feed loading - go to network first and fall back to cache to ensure results that are as complete as possible
* Slightly improved context fetching to reduce subscriptions
* Split person feeds out into separate components
* Add timeout in scroller to keep polling for new results
* Fix fall-through on user badge click on alerts page
* Fix deletion of old events, be more aggressive

## 0.2.1

* Exclude people from search who have no profile data available
* Speed up note retrieval by sorting first when the filter isn't restrictive
* Only show a certain number of replies on popular notes, with a link at the bottom showing total replies
* Refine algorithm for which relays to drop when they don't send an eose. This helps avoid the "we couldn't find this note" error message on the note detail, since we were giving up too early.
* Improve url detection and shortening

## 0.2.0

* Completely re-worked data synchronization layer, moving from naive just-in-time requests to background listeners, loaders, and a local copy stored in dexie. Events and tags, but not people are deleted from the database on logout, and old events are periodically purged.
* Added alert badge and page.
* Improved relay page. Suggestions are now taken from
* Removed chat to keep scope of work smaller. Let me know if you'd like to see that come back.
* Split tabs out into separate components
* Removed dispatch, added cmd instead
* Added image previews in addition to link previews
* Fixed infinite scrolling
* Removed cursor/listener abstractions
* Added some default pubkeys
* Wait for some, not all relays to send eose to keep things fast
* General refactoring and bugfixing
