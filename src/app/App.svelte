<script lang="ts">
  import "@fortawesome/fontawesome-free/css/fontawesome.css"
  import "@fortawesome/fontawesome-free/css/solid.css"

  import type {ComponentType, SvelteComponentTyped} from "svelte"
  import {nip19} from "nostr-tools"
  import type {Relay} from "src/engine"
  import {onMount} from "svelte"
  import {Router, links} from "svelte-routing"
  import {globalHistory} from "svelte-routing/src/history"
  import {isNil, find, last} from "ramda"
  import {Storage, seconds, Fetch, shuffle} from "hurdak"
  import {tryFetch, hexToBech32, bech32ToHex, now} from "src/util/misc"
  import {userKinds} from "src/util/nostr"
  import {default as engine} from "src/app/engine"
  import {
    Keys,
    Nip65,
    pubkeyLoader,
    user,
    Env,
    Network,
    Builder,
    Outbox,
    Settings,
    storage,
  } from "src/app/engine"
  import {listenForNotifications} from "src/app/state"
  import {theme, getThemeVariables, appName, modal} from "src/partials/state"
  import {logUsage} from "src/app/state"
  import SideNav from "src/app/SideNav.svelte"
  import Routes from "src/app/Routes.svelte"
  import Toast from "src/app/Toast.svelte"
  import TopNav from "src/app/TopNav.svelte"
  import Modal from "src/app/Modal.svelte"
  import ForegroundButtons from "src/app/ForegroundButtons.svelte"

  // Migration from 0.2.34
  if (Object.hasOwn(localStorage, "agent/keys/pubkey")) {
    try {
      Keys.setKeyState({
        method: Storage.getJson("agent/keys/method"),
        pubkey: Storage.getJson("agent/keys/pubkey"),
        privkey: Storage.getJson("agent/keys/privkey"),
        bunkerKey: Storage.getJson("agent/keys/bunkerKey"),
      })

      Keys.pubkey.set(Storage.getJson("agent/keys/pubkey"))

      const {settings} = JSON.parse(localStorage.getItem("agent/user/profile"))

      setTimeout(
        () =>
          user.setSettings({
            last_updated: settings.lastUpdated || 0,
            relay_limit: settings.relayLimit || 10,
            default_zap: settings.defaultZap || 21,
            show_media: settings.showMedia || true,
            report_analytics: settings.reportAnalytics || true,
            dufflepud_url: settings.dufflepudUrl || Env.DUFFLEPUD_URL,
            multiplextr_url: settings.multiplextrUrl || Env.MULTIPLEXTR_URL,
          }),
        3000
      )
    } catch (e) {
      // pass
    }

    localStorage.removeItem("agent/keys/method")
    localStorage.removeItem("agent/keys/pubkey")
    localStorage.removeItem("agent/keys/privkey")
    localStorage.removeItem("agent/keys/bunkerKey")
  }

  const TypedRouter = Router as ComponentType<SvelteComponentTyped>

  Object.assign(window, {...engine, nip19, user, bech32ToHex, hexToBech32})

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

  const seenChallenges = new Set()

  // When we get an AUTH challenge from our pool, attempt to authenticate
  Network.authHandler = async (url, challenge) => {
    if (Keys.canSign.get() && !seenChallenges.has(challenge)) {
      seenChallenges.add(challenge)

      const rawEvent = Builder.authenticate(url, challenge)
      const [event] = await Outbox.publish(rawEvent, [url], null, "AUTH")

      return event
    }
  }

  let scrollY

  onMount(() => {
    // Log modals, keep scroll position on body, but don't allow scrolling
    const unsubModal = modal.stack.subscribe($stack => {
      if (find(x => !x.mini, $stack)) {
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
    const pubkey = Keys.pubkey.get()

    // Make sure the user's stuff is loaded, but don't call loadAppData
    // since that reloads messages and stuff
    if (pubkey) {
      pubkeyLoader.load(pubkey, {force: true, kinds: userKinds})
      listenForNotifications()
    }

    const interval = setInterval(async () => {
      if (!Settings.getSetting("dufflepud_url")) {
        return
      }

      // Find relays with old/missing metadata and refresh them. Only pick a
      // few so we're not sending too many concurrent http requests
      const staleRelays = shuffle(
        Nip65.relays.get().filter(r => (r.info?.last_checked || 0) < now() - seconds(7, "day"))
      ).slice(0, 10) as Relay[]

      for (const relay of staleRelays) {
        tryFetch(async () => {
          const info = await Fetch.fetchJson(Settings.dufflepud("relay/info"), {
            method: "POST",
            body: JSON.stringify({url: relay.url}),
            headers: {
              "Content-Type": "application/json",
            },
          })

          Nip65.relays.key(relay.url).merge({...info, last_checked: now()})
        })
      }
    }, 30_000)

    return () => {
      clearInterval(interval)
    }
  })

  const {pubkey} = Keys
</script>

<TypedRouter url={pathname}>
  <div use:links>
    {#key $pubkey || "anonymous"}
      <Routes />
      <ForegroundButtons />
      <SideNav />
      <TopNav />
    {/key}
    <Modal />
    <Toast />
  </div>
</TypedRouter>
