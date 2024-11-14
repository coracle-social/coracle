<script lang="ts">
  import "@src/app.css"
  import {onMount} from "svelte"
  import {get, derived} from "svelte/store"
  import {page} from "$app/stores"
  import {dev} from "$app/environment"
  import {identity, uniq, sleep, take, sortBy, ago, now, HOUR, WEEK, Worker} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {
    PROFILE,
    REACTION,
    ZAP_RESPONSE,
    FOLLOWS,
    RELAYS,
    INBOX_RELAYS,
    WRAP,
    DELETE,
    getPubkeyTagValues,
    getListTags,
  } from "@welshman/util"
  import {throttled} from "@welshman/store"
  import {
    relays,
    handles,
    loadRelay,
    db,
    initStorage,
    repository,
    pubkey,
    plaintext,
    freshness,
    storageAdapters,
    tracker,
    session,
    signer,
    dropSession,
    getRelayUrls,
    userInboxRelaySelections,
  } from "@welshman/app"
  import * as lib from "@welshman/lib"
  import * as util from "@welshman/util"
  import * as net from "@welshman/net"
  import * as app from "@welshman/app"
  import AppContainer from "@app/components/AppContainer.svelte"
  import ModalContainer from "@app/components/ModalContainer.svelte"
  import {setupTracking} from "@app/tracking"
  import {setupAnalytics} from "@app/analytics"
  import {theme} from "@app/theme"
  import {
    INDEXER_RELAYS,
    getMembershipUrls,
    getMembershipRooms,
    userMembership,
    ensureUnwrapped,
    MEMBERSHIPS,
    MESSAGE,
    COMMENT,
    THREAD,
    GENERAL,
  } from "@app/state"
  import {loadUserData, subscribePersistent} from "@app/commands"
  import {checked} from "@app/notifications"
  import * as notifications from "@app/notifications"
  import * as state from "@app/state"

  // Migration: old nostrtalk instance used different sessions
  if ($session && !$signer) {
    dropSession($session.pubkey)
  }

  let ready: Promise<unknown> = Promise.resolve()

  onMount(async () => {
    Object.assign(window, {get, ...lib, ...util, ...net, ...app, ...state, ...notifications})

    const getScoreEvent = () => {
      const ALWAYS_KEEP = Infinity
      const NEVER_KEEP = 0

      const reactionKinds = [REACTION, ZAP_RESPONSE]
      const metaKinds = [PROFILE, FOLLOWS, RELAYS, INBOX_RELAYS]
      const $sessionKeys = new Set(Object.keys(app.sessions.get()))
      const $userFollows = new Set(getPubkeyTagValues(getListTags(get(app.userFollows))))
      const $maxWot = get(app.maxWot)

      return (e: TrustedEvent) => {
        const isFollowing = $userFollows.has(e.pubkey)

        // No need to keep a record of everyone who follows the current user
        if (e.kind === FOLLOWS && !isFollowing) return NEVER_KEEP

        // Always keep stuff by or tagging a signed in user
        if ($sessionKeys.has(e.pubkey)) return ALWAYS_KEEP
        if (e.tags.some(t => $sessionKeys.has(t[1]))) return ALWAYS_KEEP

        // Get rid of irrelevant messages, reactions, and likes
        if (e.wrap || e.kind === 4 || e.kind === WRAP) return NEVER_KEEP
        if (reactionKinds.includes(e.kind)) return NEVER_KEEP

        // If the user follows this person, use max wot score
        let score = isFollowing ? $maxWot : app.getUserWotScore(e.pubkey)

        // Inflate the score for profiles/relays/follows to avoid redundant fetches
        // Demote non-metadata type events, and introduce recency bias
        score *= metaKinds.includes(e.kind) ? 2 : e.created_at / now()

        return score
      }
    }

    const migrateFreshness = (data: {key: string; value: number}[]) => {
      const cutoff = ago(HOUR)

      return data.filter(({value}) => value < cutoff)
    }

    const migratePlaintext = (data: {key: string; value: number}[]) => data.slice(0, 10_000)

    const migrateEvents = (events: TrustedEvent[]) => {
      if (events.length < 50_000) {
        return events
      }

      const scoreEvent = getScoreEvent()

      return take(
        30_000,
        sortBy(e => -scoreEvent(e), events),
      )
    }

    if (!db) {
      setupTracking()
      setupAnalytics()

      ready = initStorage("flotilla", 4, {
        events: storageAdapters.fromRepository(repository, {throttle: 300, migrate: migrateEvents}),
        relays: {keyPath: "url", store: throttled(1000, relays)},
        handles: {keyPath: "nip05", store: throttled(1000, handles)},
        checked: storageAdapters.fromObjectStore(checked, {throttle: 1000}),
        freshness: storageAdapters.fromObjectStore(freshness, {
          throttle: 1000,
          migrate: migrateFreshness,
        }),
        plaintext: storageAdapters.fromObjectStore(plaintext, {
          throttle: 1000,
          migrate: migratePlaintext,
        }),
        tracker: storageAdapters.fromTracker(tracker, {throttle: 1000}),
      }).then(() => sleep(300))

      // Unwrap gift wraps as they come in, but throttled
      const unwrapper = new Worker<TrustedEvent>({chunkSize: 10})

      unwrapper.addGlobalHandler(ensureUnwrapped)

      repository.on("update", ({added}) => {
        for (const event of added) {
          if (event.kind === WRAP) {
            unwrapper.push(event)
          }
        }
      })

      // Load relay info
      for (const url of INDEXER_RELAYS) {
        loadRelay(url)
      }

      // Load user data
      if ($pubkey) {
        await loadUserData($pubkey)
      }

      // Listen for space data, populate space-based notifications
      let unsubRooms: any

      userMembership.subscribe($membership => {
        unsubRooms?.()

        const since = ago(30)
        const rooms = uniq(getMembershipRooms($membership).map(m => m.room)).concat(GENERAL)
        const relays = uniq(getMembershipUrls($membership))

        subscribePersistent({
          relays,
          filters: [
            {kinds: [THREAD], since},
            {kinds: [THREAD], limit: 1},
            {kinds: [MESSAGE], "#~": rooms, since},
            {kinds: [MESSAGE], "#~": rooms, limit: 1},
            {kinds: [COMMENT], "#K": [THREAD, MESSAGE].map(String), since},
            {kinds: [COMMENT], "#K": [THREAD, MESSAGE].map(String), limit: 1},
            {kinds: [DELETE], "#k": [THREAD, COMMENT, MESSAGE].map(String), since},
            {kinds: [MEMBERSHIPS], "#r": relays, since: ago(WEEK, 2)},
          ],
        })
      })

      // Listen for chats, populate chat-based notifications
      let unsubChats: any

      derived([pubkey, userInboxRelaySelections], identity).subscribe(
        ([$pubkey, $userInboxRelaySelections]) => {
          unsubChats?.()

          if ($pubkey) {
            unsubChats = subscribePersistent({
              filters: [
                {kinds: [WRAP], "#p": [$pubkey], since: ago(WEEK, 2)},
                {kinds: [WRAP], "#p": [$pubkey], limit: 100},
              ],
              relays: getRelayUrls($userInboxRelaySelections),
            })
          }
        },
      )
    }
  })
</script>

<svelte:head>
  {#if !dev}
    <link rel="manifest" href="/manifest.webmanifest" />
  {/if}
</svelte:head>

{#await ready}
  <div data-theme={$theme} />
{:then}
  <div data-theme={$theme}>
    <AppContainer>
      {#key $page.url.pathname}
        <slot />
      {/key}
    </AppContainer>
    <ModalContainer />
    <div class="tippy-target" />
  </div>
{/await}
