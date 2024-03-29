<script lang="ts">
  import "@fortawesome/fontawesome-free/css/fontawesome.css"
  import "@fortawesome/fontawesome-free/css/solid.css"

  import {nip19} from "nostr-tools"
  import {pluck} from "ramda"
  import {seconds, Fetch} from "hurdak"
  import {now, normalizeRelayUrl} from "paravel"
  import logger from "src/util/logger"
  import * as misc from "src/util/misc"
  import * as nostr from "src/util/nostr"
  import {storage, session, stateKey, relays, getSetting, dufflepud} from "src/engine"
  import * as engine from "src/engine"
  import {loadAppData, loadUserData} from "src/app/state"
  import {themeVariables, appName} from "src/partials/state"
  import Menu from "src/app/Menu.svelte"
  import Routes from "src/app/Routes.svelte"
  import Toast from "src/app/Toast.svelte"
  import Nav from "src/app/Nav.svelte"
  import ForegroundButtons from "src/app/ForegroundButtons.svelte"
  import {isNil} from "ramda"
  import {onMount} from "svelte"
  import {memoize} from "src/util/misc"
  import {logUsage} from "src/app/state"
  import {
    router,
    asChannelId,
    asPerson,
    asNaddr,
    asCsv,
    asJson,
    asString,
    asUrlComponent,
    asFilter,
    asNote,
    asRelay,
    asEntity,
  } from "src/app/router"

  // Routes

  router.register("/about", import("src/app/views/About.svelte"))
  router.register("/search", import("src/app/views/Search.svelte"))
  router.register("/events", import("src/app/views/Calendar.svelte"))

  router.register("/channels", import("src/app/views/ChannelsList.svelte"), {
    requireSigner: true,
  })
  router.register("/channels/create", import("src/app/views/ChannelCreate.svelte"), {
    requireSigner: true,
  })
  router.register("/channels/requests", import("src/app/views/ChannelsList.svelte"), {
    requireSigner: true,
  })
  router.register("/channels/:channelId", import("src/app/views/ChannelsDetail.svelte"), {
    requireSigner: true,
    serializers: {
      channelId: asChannelId,
    },
  })

  router.register("/events/:address", import("src/app/views/EventDetail.svelte"), {
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.register("/events/:address/edit", import("src/app/views/EventEdit.svelte"), {
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.register("/events/:address/delete", import("src/app/views/EventDelete.svelte"), {
    serializers: {
      address: asNaddr("address"),
    },
  })

  router.register("/groups", import("src/app/views/GroupList.svelte"))
  router.register("/groups/new", import("src/app/views/GroupCreate.svelte"), {
    requireSigner: true,
  })
  router.register("/groups/:address/edit", import("src/app/views/GroupEdit.svelte"), {
    requireSigner: true,
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.register("/groups/:address/info", import("src/app/views/GroupInfo.svelte"), {
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.register("/groups/:address/share", import("src/app/views/GroupShare.svelte"), {
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.register("/groups/:address/rotate", import("src/app/views/GroupRotate.svelte"), {
    requireSigner: true,
    serializers: {
      address: asNaddr("address"),
      addMembers: asCsv("addMembers"),
      removeMembers: asCsv("removeMembers"),
    },
  })
  router.register("/groups/:address/:activeTab", import("src/app/views/GroupDetail.svelte"), {
    serializers: {
      address: asNaddr("address"),
      claim: asString('claim'),
    },
  })
  router.register("/groups/:address", import("src/app/views/GroupDetail.svelte"), {
    serializers: {
      address: asNaddr("address"),
      claim: asString('claim'),
    },
  })

  router.register("/help/:topic", import("src/app/views/Help.svelte"))

  router.register("/invite", import("src/app/views/InviteAccept.svelte"), {
    serializers: {
      people: asCsv("people"),
      relays: asCsv("relays"),
      groups: asCsv("groups"),
    },
  })
  router.register("/invite/create", import("src/app/views/InviteCreate.svelte"), {
    serializers: {
      initialPubkey: asUrlComponent("initialPubkey"),
      initialGroupAddress: asUrlComponent("initialGroupAddress"),
    },
  })

  router.register("/lists", import("src/app/views/ListList.svelte"))
  router.register("/lists/create", import("src/app/views/ListEdit.svelte"))
  router.register("/lists/select", import("src/app/views/ListSelect.svelte"), {
    serializers: {
      type: asString("type"),
      value: asString("value"),
    },
  })
  router.register("/lists/:address", import("src/app/views/ListEdit.svelte"), {
    serializers: {
      address: asNaddr("address"),
    },
  })

  router.register("/login", import("src/app/views/Login.svelte"))
  router.register("/login/bunker", import("src/app/views/LoginBunker.svelte"))
  router.register("/login/privkey", import("src/app/views/LoginPrivKey.svelte"))
  router.register("/login/pubkey", import("src/app/views/LoginPubKey.svelte"))
  router.register("/login/connect", import("src/app/views/LoginConnect.svelte"), {
    requireUser: true,
  })
  router.register("/logout", import("src/app/views/Logout.svelte"))

  router.register("/listings", import("src/app/views/Market.svelte"))
  router.register("/listings/:address/edit", import("src/app/views/ListingEdit.svelte"), {
    requireSigner: true,
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.register("/listings/:address/delete", import("src/app/views/ListingDelete.svelte"), {
    requireSigner: true,
    serializers: {
      address: asNaddr("address"),
    },
  })

  router.register("/media/:url", import("src/app/views/MediaDetail.svelte"), {
    serializers: {
      url: asUrlComponent("url"),
    },
  })

  router.register("/", import("src/app/views/Home.svelte"), {
    serializers: {
      filter: asFilter,
    },
  })
  router.register("/notes", import("src/app/views/Home.svelte"), {
    serializers: {
      filter: asFilter,
    },
  })
  router.register("/notes/create", import("src/app/views/NoteCreate.svelte"), {
    requireSigner: true,
    serializers: {
      pubkey: asPerson,
      group: asNaddr("group"),
      type: asString("type"),
    },
  })
  router.register("/notes/:entity", import("src/app/views/NoteDetail.svelte"), {
    serializers: {
      entity: asNote,
    },
  })
  router.register("/notes/:entity/label", import("src/app/views/LabelCreate.svelte"), {
    serializers: {
      entity: asNote,
    },
  })
  router.register("/notes/:entity/status", import("src/app/views/PublishInfo.svelte"), {
    serializers: {
      entity: asNote,
    },
  })
  router.register("/notes/:entity/thread", import("src/app/views/ThreadDetail.svelte"), {
    serializers: {
      entity: asNote,
    },
  })

  router.register("/notifications", import("src/app/views/Notifications.svelte"), {
    requireUser: true,
  })
  router.register("/notifications/:activeTab", import("src/app/views/Notifications.svelte"), {
    requireUser: true,
  })

  router.register("/signup", import("src/app/views/Onboarding.svelte"))

  router.register("/people/list", import("src/app/shared/PersonList.svelte"), {
    serializers: {
      pubkeys: asCsv("pubkeys"),
    },
  })
  router.register("/people/:entity", import("src/app/views/PersonDetail.svelte"), {
    required: ["pubkey"],
    serializers: {
      entity: asPerson,
      filter: asFilter,
    },
  })
  router.register("/people/:entity/followers", import("src/app/views/PersonFollowers.svelte"), {
    required: ["pubkey"],
    serializers: {
      entity: asPerson,
    },
  })
  router.register("/people/:entity/follows", import("src/app/views/PersonFollows.svelte"), {
    required: ["pubkey"],
    serializers: {
      entity: asPerson,
    },
  })
  router.register("/people/:entity/info", import("src/app/views/PersonInfo.svelte"), {
    required: ["pubkey"],
    serializers: {
      entity: asPerson,
    },
  })

  router.register("/qrcode/:code", import("src/app/views/QRCode.svelte"), {
    serializers: {
      code: asUrlComponent("code"),
    },
  })

  router.register("/relays/browse", import("src/app/views/RelayBrowse.svelte"))
  router.register("/relays/:entity", import("src/app/views/RelayDetail.svelte"), {
    serializers: {
      entity: asRelay,
      filter: asFilter,
    },
  })
  router.register("/relays/:entity/review", import("src/app/views/RelayReview.svelte"), {
    serializers: {
      entity: asRelay,
    },
  })

  router.register("/settings", import("src/app/views/UserSettings.svelte"), {
    requireUser: true,
  })
  router.register("/settings/content", import("src/app/views/UserContent.svelte"), {
    requireUser: true,
  })
  router.register("/settings/data", import("src/app/views/UserData.svelte"), {
    requireUser: true,
  })
  router.register("/settings/data/export", import("src/app/views/DataExport.svelte"), {
    requireUser: true,
  })
  router.register("/settings/data/import", import("src/app/views/DataImport.svelte"), {
    requireUser: true,
  })
  router.register("/settings/keys", import("src/app/views/UserKeys.svelte"), {
    requireUser: true,
  })
  router.register("/settings/profile", import("src/app/views/UserProfile.svelte"), {
    requireUser: true,
  })
  router.register("/settings/relays", import("src/app/views/RelayList.svelte"))

  router.register("/topics/:topic", import("src/app/views/TopicFeed.svelte"))

  router.register("/zap", import("src/app/views/Zap.svelte"), {
    required: ["splits"],
    serializers: {
      eid: asNote,
      splits: asJson("splits"),
      anonymous: asJson("anonymous"),
    },
  })

  router.register("/:entity", import("src/app/views/Bech32Entity.svelte"), {
    serializers: {
      entity: asEntity,
      filter: asFilter,
    },
  })
  router.register("/:entity/*", import("src/app/views/Bech32Entity.svelte"), {
    serializers: {
      entity: asEntity,
      filter: asFilter,
    },
  })

  router.init()

  // Globals
  ;(window as any).g = {
    ...engine,
    nip19,
    logger,
    router,
    nostr,
    misc,
  }

  // Theme

  const style = document.createElement("style")

  document.head.append(style)

  $: style.textContent = `:root { ${$themeVariables}; background: var(--neutral-800); }`

  // Scroll position

  let scrollY

  const unsubHistory = router.history.subscribe($history => {
    if ($history[0].config.modal) {
      // This is not idempotent, so don't duplicate it
      if (document.body.style.position !== "fixed") {
        scrollY = window.scrollY

        document.body.style.top = `-${scrollY}px`
        document.body.style.position = `fixed`
      }
    } else if (document.body.style.position === "fixed") {
      document.body.setAttribute("style", "")

      if (!isNil(scrollY)) {
        window.scrollTo(0, scrollY)
        scrollY = null
      }
    }
  })

  // Usage logging, router listener

  onMount(() => {
    const unsubPage = router.page.subscribe(
      memoize($page => {
        if ($page) {
          logUsage($page.path)
        }

        window.scrollTo(0, 0)
      }),
    )

    const unsubModal = router.modal.subscribe($modal => {
      if ($modal) {
        logUsage($modal.path)
      }
    })

    const unsubRouter = router.listen()

    return () => {
      unsubPage()
      unsubModal()
      unsubRouter()
      unsubHistory()
    }
  })

  // Protocol handler

  try {
    const handler = navigator.registerProtocolHandler as (
      scheme: string,
      handler: string,
      name: string,
    ) => void

    handler?.("web+nostr", `${location.origin}/%s`, appName)
    handler?.("nostr", `${location.origin}/%s`, appName)
  } catch (e) {
    // pass
  }

  // App data boostrap and relay meta fetching

  storage.ready.then(() => {
    loadAppData()

    if ($session) {
      loadUserData()
    }

    const interval = setInterval(async () => {
      if (!getSetting("dufflepud_url")) {
        return
      }

      // Find relays with old/missing metadata and refresh them. Only pick a
      // few so we're not asking for too much data at once
      const staleRelays = relays
        .get()
        .filter(r => (r.info?.last_checked || 0) < now() - seconds(7, "day"))
        .slice(0, 20)

      misc.tryFetch(async () => {
        const result = await Fetch.fetchJson(dufflepud("relay/info"), {
          method: "POST",
          body: JSON.stringify({urls: pluck("url", staleRelays)}),
          headers: {
            "Content-Type": "application/json",
          },
        })

        for (const {url: rawUrl, info} of result.data) {
          const url = normalizeRelayUrl(rawUrl)

          relays.key(url).merge({...info, url, last_checked: now()})
        }
      })
    }, 30_000)

    return () => {
      clearInterval(interval)
    }
  })
</script>

{#await storage.ready}
  <!-- pass -->
{:then}
  <div class="text-tinted-200">
    <Routes />
    {#key $stateKey}
      <ForegroundButtons />
      <Nav />
      <Menu />
      <Toast />
    {/key}
  </div>
{/await}
