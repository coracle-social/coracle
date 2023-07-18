<script lang="ts">
  import "@fortawesome/fontawesome-free/css/fontawesome.css"
  import "@fortawesome/fontawesome-free/css/solid.css"

  import type {ComponentType, SvelteComponentTyped} from "svelte"
  import {onMount} from "svelte"
  import {Router, links} from "svelte-routing"
  import {globalHistory} from "svelte-routing/src/history"
  import {isNil, last} from "ramda"
  import {
    timedelta,
    hexToBech32,
    bech32ToHex,
    shuffle,
    now,
    tryFunc,
    fetchJson,
    tryFetch,
    getLocalJson,
  } from "src/util/misc"
  import {userKinds} from "src/util/nostr"
  import engine from "src/app/engine"
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
    engine.Keys.setKeyState({
      method: getLocalJson("agent/keys/method"),
      pubkey: getLocalJson("agent/keys/pubkey"),
      privkey: getLocalJson("agent/keys/privkey"),
      bunkerKey: getLocalJson("agent/keys/bunkerKey"),
    })

    engine.Keys.pubkey.set(getLocalJson("agent/keys/pubkey"))

    const {settings} = JSON.parse(localStorage.getItem("agent/user/profile"))

    engine.User.setSettings({
      last_updated: settings.lastUpdated || 0,
      relay_limit: settings.relayLimit || 10,
      default_zap: settings.defaultZap || 21,
      show_media: settings.showMedia || true,
      report_analytics: settings.reportAnalytics || true,
      dufflepud_url: settings.dufflepudUrl || engine.Env.DUFFLEPUD_URL,
      multiplextr_url: settings.multiplextrUrl || engine.Env.MULTIPLEXTR_URL,
    })

    localStorage.removeItem("agent/keys/method")
    localStorage.removeItem("agent/keys/pubkey")
    localStorage.removeItem("agent/keys/privkey")
    localStorage.removeItem("agent/keys/bunkerKey")
  }

  const TypedRouter = Router as ComponentType<SvelteComponentTyped>

  Object.assign(window, {engine, bech32ToHex, hexToBech32})

  export let pathname = location.pathname
  export let hash = location.hash

  const style = document.createElement("style")

  document.head.append(style)

  $: style.textContent = `:root { ${getThemeVariables($theme)}; background: var(--gray-8); }`

  tryFunc(() =>
    (
      navigator.registerProtocolHandler as (scheme: string, handler: string, name: string) => void
    )?.("web+nostr", `${location.origin}/%s`, appName)
  )

  const seenChallenges = new Set()

  // When we get an AUTH challenge from our pool, attempt to authenticate
  engine.Network.authHandler = async (url, challenge) => {
    if (engine.Keys.canSign.get() && !seenChallenges.has(challenge)) {
      seenChallenges.add(challenge)

      const rawEvent = engine.Builder.authenticate(url, challenge)
      const [event] = await engine.Outbox.publish(rawEvent, [url], null, "AUTH")

      return event
    }
  }

  onMount(() => {
    let scrollY

    // Log modals, keep scroll position on body, but don't allow scrolling
    const unsubModal = modal.stack.subscribe($stack => {
      if ($stack.filter(x => !x.mini).length > 0) {
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

  engine.Storage.ready.then(() => {
    const pubkey = engine.Keys.pubkey.get()

    // Make sure the user's stuff is loaded, but don't call loadAppData
    // since that reloads messages and stuff
    if (pubkey) {
      engine.PubkeyLoader.load(pubkey, {force: true, kinds: userKinds})
      listenForNotifications()
    }

    const interval = setInterval(async () => {
      if (!engine.User.getSetting("dufflepud_url")) {
        return
      }

      // Find relays with old/missing metadata and refresh them. Only pick a
      // few so we're not sending too many concurrent http requests
      const staleRelays = shuffle(
        engine.Nip65.relays
          .get()
          .filter(r => (r.meta?.last_checked || 0) < now() - timedelta(7, "days"))
      ).slice(0, 10)

      for (const relay of staleRelays) {
        tryFetch(async () => {
          const info = await fetchJson(engine.User.dufflepud("relay/info"), {
            method: "POST",
            body: JSON.stringify({url: relay.url}),
            headers: {
              "Content-Type": "application/json",
            },
          })

          engine.Nip65.relays.key(relay.url).merge({...info, last_checked: now()})
        })
      }
    }, 30_000)

    return () => {
      clearInterval(interval)
    }
  })
</script>

<TypedRouter url={pathname}>
  <div use:links>
    <Routes />
    <ForegroundButtons />
    <SideNav />
    <TopNav />
    <Modal />
    <Toast />
  </div>
</TypedRouter>
