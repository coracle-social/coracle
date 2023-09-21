<script lang="ts">
  import "@fortawesome/fontawesome-free/css/fontawesome.css"
  import "@fortawesome/fontawesome-free/css/solid.css"

  import type {ComponentType, SvelteComponentTyped} from "svelte"
  import {nip19} from "nostr-tools"
  import {onMount} from "svelte"
  import {Router, links} from "svelte-routing"
  import {globalHistory} from "svelte-routing/src/history"
  import {isNil, last} from "ramda"
  import {seconds, Fetch, shuffle} from "hurdak"
  import {tryFetch, hexToBech32, bech32ToHex, now} from "src/util/misc"
  import type {Relay} from "src/engine"
  import {storage, session, stateKey, relays, getSetting, dufflepud} from "src/engine"
  import * as engine from "src/engine"
  import {loadAppData} from "src/app/state"
  import {theme, getThemeVariables, appName, modal} from "src/partials/state"
  import {logUsage} from "src/app/state"
  import SideNav from "src/app/SideNav.svelte"
  import Routes from "src/app/Routes.svelte"
  import Toast from "src/app/Toast.svelte"
  import TopNav from "src/app/TopNav.svelte"
  import Modal from "src/app/Modal.svelte"
  import ForegroundButtons from "src/app/ForegroundButtons.svelte"

  const TypedRouter = Router as ComponentType<SvelteComponentTyped>

  Object.assign(window, {...engine, nip19, bech32ToHex, hexToBech32})

  export let pathname = location.pathname
  export let hash = location.hash

  const style = document.createElement("style")

  document.head.append(style)

  $: style.textContent = `:root { ${getThemeVariables($theme)}; background: var(--gray-8); }`

  try {
    const handler = navigator.registerProtocolHandler as (
      scheme: string,
      handler: string,
      name: string
    ) => void

    handler?.("web+nostr", `${location.origin}/%s`, appName)
    handler?.("nostr", `${location.origin}/%s`, appName)
  } catch (e) {
    // pass
  }

  let scrollY

  onMount(() => {
    // Log modals, keep scroll position on body, but don't allow scrolling
    const unsubModal = modal.stack.subscribe($stack => {
      if ($stack.length > 0) {
        logUsage(btoa(["modal", last($stack).type].join(":")))

        // This is not idempotent, so don't duplicate it
        if (document.body.style.position !== "fixed") {
          scrollY = window.scrollY

          document.body.style.top = `-${scrollY}px`
          document.body.style.position = `fixed`
        }
      } else if (!isNil(scrollY)) {
        const offset = scrollY

        // I don't know why this timeout is necessary
        setTimeout(() => {
          document.body.setAttribute("style", "")
          window.scrollTo(0, offset)
        }, 100)

        scrollY = null
      }
    })

    // Remove identifying information, e.g. pubkeys, event ids, etc
    const getPageName = () =>
      location.pathname.slice(1).replace(/(npub|nprofile|note|nevent)1[^\/]+/g, (_, m) => `<${m}>`)

    // Log usage on navigate
    const unsubHistory = globalHistory.listen(({location}) => {
      if (!location.hash) {
        logUsage(btoa(["page", getPageName()].join(":")))

        if (!hash) {
          document.body.scrollIntoView({
            behavior: location.pathname === pathname ? "smooth" : "auto",
          })
        }
      }

      pathname = location.pathname
      hash = location.hash
    })

    logUsage(btoa(["page", getPageName()].join(":")))

    return () => {
      unsubModal()
      unsubHistory()
    }
  })

  storage.ready.then(() => {
    if ($session) {
      loadAppData()
    }

    const interval = setInterval(async () => {
      if (!getSetting("dufflepud_url")) {
        return
      }

      // Find relays with old/missing metadata and refresh them. Only pick a
      // few so we're not sending too many concurrent http requests
      const staleRelays = shuffle(
        relays.get().filter(r => (r.info?.last_checked || 0) < now() - seconds(7, "day"))
      ).slice(0, 10) as Relay[]

      for (const relay of staleRelays) {
        tryFetch(async () => {
          const info = await Fetch.fetchJson(dufflepud("relay/info"), {
            method: "POST",
            body: JSON.stringify({url: relay.url}),
            headers: {
              "Content-Type": "application/json",
            },
          })

          relays.key(relay.url).merge({...info, last_checked: now()})
        })
      }
    }, 30_000)

    return () => {
      clearInterval(interval)
    }
  })
</script>

{#await storage.ready}
  <!-- pass -->
{:then}
  <TypedRouter url={pathname}>
    <div use:links>
      {#key $stateKey}
        <Routes />
        <ForegroundButtons />
        <SideNav />
        <TopNav />
      {/key}
      <Modal />
      <Toast />
    </div>
  </TypedRouter>
{/await}
