<script lang="ts">
  import "@src/app.css"
  import {onMount} from "svelte"
  import * as nip19 from "nostr-tools/nip19"
  import {get, derived} from "svelte/store"
  import {App} from "@capacitor/app"
  import {dev} from "$app/environment"
  import {goto} from "$app/navigation"
  import {bytesToHex, hexToBytes} from "@noble/hashes/utils"
  import {identity, memoize, sleep, defer, ago, WEEK, TaskQueue} from "@welshman/lib"
  import type {TrustedEvent, StampedEvent} from "@welshman/util"
  import {
    WRAP,
    EVENT_TIME,
    THREAD,
    MESSAGE,
    INBOX_RELAYS,
    DIRECT_MESSAGE,
    MUTES,
    FOLLOWS,
    PROFILE,
    RELAYS,
    BLOSSOM_SERVERS,
    getRelaysFromList,
  } from "@welshman/util"
  import {Nip46Broker, makeSecret} from "@welshman/signer"
  import type {Socket} from "@welshman/net"
  import {request, defaultSocketPolicies, makeSocketPolicyAuth} from "@welshman/net"
  import {
    loadRelay,
    db,
    initStorage,
    repository,
    pubkey,
    defaultStorageAdapters,
    session,
    signer,
    dropSession,
    userInboxRelaySelections,
    loginWithNip01,
    loginWithNip46,
    EventsStorageAdapter,
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
  import {loadUserData, listenForNotifications} from "@app/requests"
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
          const clientSecret = makeSecret()
          const {signerPubkey, connectSecret, relays} = Nip46Broker.parseBunkerUrl(login)
          const broker = new Nip46Broker({relays, clientSecret, signerPubkey})
          const result = await broker.connect(connectSecret, appState.NIP46_PERMS)
          const pubkey = await broker.getPublicKey()

          // TODO: remove ack result
          if (pubkey && ["ack", connectSecret].includes(result)) {
            await loadUserData(pubkey)

            loginWithNip46(pubkey, clientSecret, signerPubkey, relays)
            broker.cleanup()
            success = true
          }
        } else if (login) {
          loginWithNip01(nsecDecode(login))
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

      // Unwrap gift wraps as they come in, but throttled
      const unwrapper = new TaskQueue<TrustedEvent>({batchSize: 10, processItem: ensureUnwrapped})

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

      await initStorage("flotilla", 8, {
        ...defaultStorageAdapters,
        events: new EventsStorageAdapter({
          name: "events",
          limit: 10_000,
          repository,
          rankEvent: (e: TrustedEvent) => {
            if ([PROFILE, FOLLOWS, MUTES, RELAYS, BLOSSOM_SERVERS, INBOX_RELAYS].includes(e.kind)) {
              return 1
            }

            if ([EVENT_TIME, THREAD, MESSAGE, DIRECT_MESSAGE].includes(e.kind)) {
              return 0.9
            }

            return 0
          },
        }),
      })

      sleep(300).then(() => ready.resolve())

      defaultSocketPolicies.push(
        makeSocketPolicyAuth({
          sign: (event: StampedEvent) => signer.get()?.sign(event),
          shouldAuth: (socket: Socket) => true,
        }),
      )

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

      userMembership.subscribe(
        memoize($membership => {
          unsubSpaces?.()
          unsubSpaces = listenForNotifications()
        }),
      )

      // Listen for chats, populate chat-based notifications
      let controller: AbortController

      derived([pubkey, canDecrypt, userInboxRelaySelections], identity).subscribe(
        ([$pubkey, $canDecrypt, $userInboxRelaySelections]) => {
          controller?.abort()
          controller = new AbortController()

          if ($pubkey && $canDecrypt) {
            request({
              signal: controller.signal,
              filters: [
                {kinds: [WRAP], "#p": [$pubkey], since: ago(WEEK, 2)},
                {kinds: [WRAP], "#p": [$pubkey], limit: 100},
              ],
              relays: getRelaysFromList($userInboxRelaySelections),
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
