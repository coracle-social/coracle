<script lang="ts">
  import "@src/app.css"
  import {onMount} from "svelte"
  import * as nip19 from "nostr-tools/nip19"
  import {get, derived} from "svelte/store"
  import {App} from "@capacitor/app"
  import {dev} from "$app/environment"
  import {goto} from "$app/navigation"
  import {bytesToHex, hexToBytes} from "@noble/hashes/utils"
  import {identity, sleep, defer, ago, WEEK, TaskQueue} from "@welshman/lib"
  import type {TrustedEvent, StampedEvent} from "@welshman/util"
  import {WRAP} from "@welshman/util"
  import {Nip46Broker, getPubkey, makeSecret} from "@welshman/signer"
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
    getRelayUrls,
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
  import {loadUserData, listenForNotifications} from "@app/requests"
  import {loginWithNip46} from "@app/commands"
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

      initStorage("flotilla", 6, defaultStorageAdapters).then(async () => {
        await sleep(300)
        ready.resolve()
      })

      defaultSocketPolicies.push(
        makeSocketPolicyAuth({
          sign: (event: StampedEvent) => signer.get()?.sign(event),
          shouldAuth: (socket: Socket) => true,
        }),
      )

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
      let chatsReq: any

      derived([pubkey, canDecrypt, userInboxRelaySelections], identity).subscribe(
        ([$pubkey, $canDecrypt, $userInboxRelaySelections]) => {
          chatsReq?.close()

          if ($pubkey && $canDecrypt) {
            chatsReq = request({
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
