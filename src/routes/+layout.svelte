<script lang="ts">
  import "@src/app.css"
  import {pwaInfo} from 'virtual:pwa-info';
  import {onMount} from "svelte"
  import {get} from "svelte/store"
  import {sleep, take, sortBy, ago, now, HOUR} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {
    PROFILE,
    REACTION,
    ZAP_RESPONSE,
    FOLLOWS,
    RELAYS,
    INBOX_RELAYS,
    WRAP,
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
  } from "@welshman/app"
  import * as lib from "@welshman/lib"
  import * as util from "@welshman/util"
  import * as app from "@welshman/app"
  import AppContainer from "@app/components/AppContainer.svelte"
  import ModalContainer from "@app/components/ModalContainer.svelte"
  import {theme} from "@app/theme"
  import {INDEXER_RELAYS, PLATFORM_LOGO, PLATFORM_ACCENT} from "@app/state"
  import {loadUserData} from "@app/commands"
  import * as state from "@app/state"

  // Migration: old nostrtalk instance used different sessions
  if ($session && !$signer) {
    dropSession($session.pubkey)
  }

  let ready: Promise<unknown> = Promise.resolve()

  onMount(() => {
    Object.assign(window, {get, ...lib, ...util, ...app, ...state})

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
      ready = initStorage("flotilla", 4, {
        events: storageAdapters.fromRepository(repository, {throttle: 300, migrate: migrateEvents}),
        relays: {keyPath: "url", store: throttled(1000, relays)},
        handles: {keyPath: "nip05", store: throttled(1000, handles)},
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

      repository.on("update", ({added}) => {
        for (const event of added) {
          state.ensureUnwrapped(event)
        }
      })

      for (const url of INDEXER_RELAYS) {
        loadRelay(url)
      }

      if ($pubkey) {
        loadUserData($pubkey)
      }
    }
  })
</script>

<svelte:head>
  <meta name="theme-color" content={PLATFORM_ACCENT} />
  <link rel="icon" href={PLATFORM_LOGO} />
  <link rel="manifest" href="/manifest.webmanifest" />
</svelte:head>

{#await ready}
  <div data-theme={$theme} />
{:then}
  <div data-theme={$theme}>
    <AppContainer>
      <slot />
    </AppContainer>
    <ModalContainer />
    <div class="tippy-target" />
  </div>
{/await}
