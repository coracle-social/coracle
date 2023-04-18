<script lang="ts">
  import "@fortawesome/fontawesome-free/css/fontawesome.css"
  import "@fortawesome/fontawesome-free/css/solid.css"

  import {onMount} from "svelte"
  import {Router, links} from "svelte-routing"
  import {globalHistory} from "svelte-routing/src/history"
  import {identity, last} from "ramda"
  import {first} from "hurdak/lib/hurdak"
  import {warn} from "src/util/logger"
  import {timedelta, hexToBech32, bech32ToHex, shuffle, now} from "src/util/misc"
  import cmd from "src/agent/cmd"
  import {onReady, relays} from "src/agent/db"
  import keys from "src/agent/keys"
  import network from "src/agent/network"
  import pool from "src/agent/pool"
  import {initializeRelayList} from "src/agent/relays"
  import sync from "src/agent/sync"
  import * as db from "src/agent/db"
  import user from "src/agent/user"
  import {loadAppData} from "src/app/state"
  import {theme, getThemeVariables, modal} from "src/partials/state"
  import {logUsage} from "src/app/state"
  import SideNav from "src/app/SideNav.svelte"
  import Routes from "src/app/Routes.svelte"
  import Toast from "src/app/Toast.svelte"
  import TopNav from "src/app/TopNav.svelte"
  import Modal from "src/app/Modal.svelte"
  import ForegroundButtons from "src/app/ForegroundButtons.svelte"

  Object.assign(window, {cmd, user, keys, network, pool, sync, db, bech32ToHex, hexToBech32})

  export let pathname = location.pathname

  const style = document.createElement("style")

  document.head.append(style)

  $: style.textContent = `:root { ${getThemeVariables($theme)}; background: var(--gray-8); }`

  const seenChallenges = new Set()

  // When we get an AUTH challenge from our pool, attempt to authenticate
  pool.Config.authHandler = async (url, challenge) => {
    if (keys.canSign() && !seenChallenges.has(challenge)) {
      seenChallenges.add(challenge)

      const publishable = await cmd.authenticate(url, challenge)

      return first(publishable.publish([{url}], null, "AUTH"))
    }
  }

  onMount(() => {
    let scrollY

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
      } else if (scrollY) {
        document.body.setAttribute("style", "")
        window.scrollTo(0, scrollY)

        scrollY = null
      }
    })

    // Remove identifying information, e.g. pubkeys, event ids, etc
    const getPageName = () =>
      location.pathname.slice(1).replace(/(npub|nprofile|note|nevent)1[^\/]+/g, (_, m) => `<${m}>`)

    // Log usage on navigate
    const unsubHistory = globalHistory.listen(({location}) => {
      pathname = location.pathname

      if (!location.hash) {
        logUsage(btoa(["page", getPageName()].join(":")))
      }
    })

    logUsage(btoa(["page", getPageName()].join(":")))

    return () => {
      unsubModal()
      unsubHistory()
    }
  })

  onReady(() => {
    initializeRelayList()

    const pubkey = user.getPubkey()

    if (pubkey) {
      loadAppData(pubkey)
    }

    const interval = setInterval(async () => {
      const {dufflepudUrl} = user.getSettings()

      if (!dufflepudUrl) {
        return
      }

      // Find relays with old/missing metadata and refresh them. Only pick a
      // few so we're not sending too many concurrent http requests
      const query = {refreshed_at: {$lt: now() - timedelta(7, "days")}}
      const staleRelays = shuffle(relays.all(query)).slice(0, 10)

      const freshRelays = await Promise.all(
        staleRelays.map(async ({url}) => {
          try {
            const res = await fetch(dufflepudUrl + "/relay/info", {
              method: "POST",
              body: JSON.stringify({url}),
              headers: {
                "Content-Type": "application/json",
              },
            })

            return {...(await res.json()), url, refreshed_at: now()}
          } catch (e) {
            if (!e.toString().includes("Failed to fetch")) {
              warn(e)
            }

            return {url, refreshed_at: now()}
          }
        })
      )

      relays.patch(freshRelays.filter(identity))
    }, 30_000)

    return () => {
      clearInterval(interval)
    }
  })
</script>

<Router url={pathname}>
  <div use:links>
    <Routes />
    <ForegroundButtons />
    <SideNav />
    <TopNav />
    <Modal />
    <Toast />
  </div>
</Router>
