<script lang="ts">
  import "@src/app.css"
  import {onMount} from "svelte"
  import * as nip19 from "nostr-tools/nip19"
  import {get, derived} from "svelte/store"
  import {App} from "@capacitor/app"
  import {dev} from "$app/environment"
  import {goto} from "$app/navigation"
  import {bytesToHex, hexToBytes} from "@noble/hashes/utils"
  import {
    identity,
    sleep,
    take,
    sortBy,
    defer,
    ago,
    now,
    HOUR,
    WEEK,
    MONTH,
    Worker,
  } from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {
    MESSAGE,
    PROFILE,
    DELETE,
    REACTION,
    ZAP_RESPONSE,
    FOLLOWS,
    RELAYS,
    INBOX_RELAYS,
    WRAP,
    getPubkeyTagValues,
    getListTags,
  } from "@welshman/util"
  import {Nip46Broker, getPubkey, makeSecret} from "@welshman/signer"
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
    subscribe,
    userInboxRelaySelections,
    addSession,
  } from "@welshman/app"
  import * as lib from "@welshman/lib"
  import * as util from "@welshman/util"
  import * as welshmanSigner from "@welshman/signer"
  import * as net from "@welshman/net"
  import * as app from "@welshman/app"
  import AppContainer from "@app/components/AppContainer.svelte"
  import ModalContainer from "@app/components/ModalContainer.svelte"
  import {setupTracking} from "@app/tracking"
  import {setupAnalytics} from "@app/analytics"
  import {nsecDecode} from "@lib/util"
  import {theme} from "@app/theme"
  import {INDEXER_RELAYS, userMembership, ensureUnwrapped, canDecrypt} from "@app/state"
  import {loadUserData, loginWithNip46} from "@app/commands"
  import {listenForNotifications} from "@app/requests"
  import * as commands from "@app/commands"
  import * as requests from "@app/requests"
  import * as notifications from "@app/notifications"
  import * as appState from "@app/state"

  // Migration: old nostrtalk instance used different sessions
  if ($session && !$signer) {
    dropSession($session.pubkey)
  }

  const {children} = $props()

  const ready = $state(defer<void>())

  onMount(async () => {
    Object.assign(window, {
      get,
      nip19,
      bytesToHex,
      hexToBytes,
      ...lib,
      ...welshmanSigner,
      ...util,
      ...net,
      ...app,
      ...appState,
      ...commands,
      ...requests,
      ...notifications,
    })

    // Nstart login
    if (window.location.hash?.startsWith("#nostr-login")) {
      const params = new URLSearchParams(window.location.hash.slice(1))
      const login = params.get("nostr-login")

      let success = false

      try {
        if (login?.startsWith("bunker://")) {
          success = await loginWithNip46({
            clientSecret: makeSecret(),
            ...Nip46Broker.parseBunkerUrl(login),
          })
        } else if (login) {
          const secret = nsecDecode(login)

          addSession({method: "nip01", secret, pubkey: getPubkey(secret)})
          success = true
        }
      } catch (e) {
        console.error(e)
      }

      if (success) {
        goto("/home")
      }
    }

    if (!db) {
      setupTracking()
      setupAnalytics()

      App.addListener("backButton", () => {
        if (window.history.length > 1) {
          window.history.back()
        } else {
          App.exitApp()
        }
      })

      initStorage("flotilla", 5, {
        relays: storageAdapters.fromCollectionStore("url", relays, {throttle: 3000}),
        handles: storageAdapters.fromCollectionStore("nip05", handles, {throttle: 3000}),
        freshness: storageAdapters.fromObjectStore(freshness, {
          throttle: 3000,
          migrate: (data: {key: string; value: number}[]) => {
            const cutoff = ago(HOUR)

            return data.filter(({value}) => value > cutoff)
          },
        }),
        plaintext: storageAdapters.fromObjectStore(plaintext, {
          throttle: 3000,
          migrate: (data: {key: string; value: number}[]) => data.slice(0, 10_000),
        }),
        events2: storageAdapters.fromRepositoryAndTracker(repository, tracker, {
          throttle: 3000,
          migrate: (events: TrustedEvent[]) => {
            if (events.length < 15_000) {
              return events
            }

            const NEVER_KEEP = 0
            const ALWAYS_KEEP = Infinity
            const reactionKinds = [REACTION, ZAP_RESPONSE, DELETE]
            const metaKinds = [PROFILE, FOLLOWS, RELAYS, INBOX_RELAYS]
            const sessionKeys = new Set(Object.keys(app.sessions.get()))
            const userFollows = new Set(getPubkeyTagValues(getListTags(get(app.userFollows))))
            const maxWot = get(app.maxWot)

            const scoreEvent = (e: TrustedEvent) => {
              const isFollowing = userFollows.has(e.pubkey)

              // No need to keep a record of everyone who follows the current user
              if (e.kind === FOLLOWS && !isFollowing) return NEVER_KEEP

              // Drop room messages after a month, re-load on demand
              if (e.kind === MESSAGE && e.created_at < ago(MONTH)) return NEVER_KEEP

              // Always keep stuff by or tagging a signed in user
              if (sessionKeys.has(e.pubkey)) return ALWAYS_KEEP
              if (e.tags.some(t => sessionKeys.has(t[1]))) return ALWAYS_KEEP

              // Get rid of irrelevant messages, reactions, and likes
              if (e.wrap || e.kind === 4 || e.kind === WRAP) return NEVER_KEEP
              if (reactionKinds.includes(e.kind)) return NEVER_KEEP

              // If the user follows this person, use max wot score
              let score = isFollowing ? maxWot : app.getUserWotScore(e.pubkey)

              // Inflate the score for profiles/relays/follows to avoid redundant fetches
              // Demote non-metadata type events, and introduce recency bias
              score *= metaKinds.includes(e.kind) ? 2 : e.created_at / now()

              return score
            }

            return take(
              10_000,
              sortBy(e => -scoreEvent(e), events),
            )
          },
        }),
      }).then(async () => {
        await sleep(300)
        ready.resolve()
      })

      // Unwrap gift wraps as they come in, but throttled
      const unwrapper = new Worker<TrustedEvent>({chunkSize: 10})

      unwrapper.addGlobalHandler(ensureUnwrapped)

      repository.on("update", ({added}) => {
        if (!$canDecrypt) {
          return
        }

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
      let unsubSpaces: any

      userMembership.subscribe($membership => {
        unsubSpaces?.()
        unsubSpaces = listenForNotifications()
      })

      // Listen for chats, populate chat-based notifications
      let chatsSub: any

      derived([pubkey, canDecrypt, userInboxRelaySelections], identity).subscribe(
        ([$pubkey, $canDecrypt, $userInboxRelaySelections]) => {
          chatsSub?.close()

          if ($pubkey && $canDecrypt) {
            chatsSub = subscribe({
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
  <div data-theme={$theme}></div>
{:then}
  <div data-theme={$theme}>
    <AppContainer>
      {@render children()}
    </AppContainer>
    <ModalContainer />
    <div class="tippy-target"></div>
  </div>
{/await}
