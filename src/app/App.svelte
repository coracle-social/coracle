<script lang="ts">
  import "@fortawesome/fontawesome-free/css/fontawesome.css"
  import "@fortawesome/fontawesome-free/css/solid.css"

  import {nip19} from "nostr-tools"
  import * as store from "svelte/store"
  import * as lib from "@welshman/lib"
  import * as util from "@welshman/util"
  import * as network from "@welshman/net"
  import * as app from "@welshman/app"
  import logger from "src/util/logger"
  import * as misc from "src/util/misc"
  import * as nostr from "src/util/nostr"
  import {ready} from "src/engine"
  import * as engine from "src/engine"
  import * as domain from "src/domain"
  import {loadAppData, slowConnections, loadUserData} from "src/app/state"
  import {themeVariables, appName} from "src/partials/state"
  import Toast from "src/partials/Toast.svelte"
  import Menu from "src/app/Menu.svelte"
  import Routes from "src/app/Routes.svelte"
  import Nav from "src/app/Nav.svelte"
  import ForegroundButtons from "src/app/ForegroundButtons.svelte"
  import About from "src/app/views/About.svelte"
  import Bech32Entity from "src/app/views/Bech32Entity.svelte"
  import Calendar from "src/app/views/Calendar.svelte"
  import ChannelCreate from "src/app/views/ChannelCreate.svelte"
  import ChannelsDetail from "src/app/views/ChannelsDetail.svelte"
  import ChannelsList from "src/app/views/ChannelsList.svelte"
  import DataExport from "src/app/views/DataExport.svelte"
  import DataImport from "src/app/views/DataImport.svelte"
  import EventDelete from "src/app/views/EventDelete.svelte"
  import EventDetail from "src/app/views/EventDetail.svelte"
  import EventEdit from "src/app/views/EventEdit.svelte"
  import FeedCreate from "src/app/views/FeedCreate.svelte"
  import FeedEdit from "src/app/views/FeedEdit.svelte"
  import FeedList from "src/app/views/FeedList.svelte"
  import GroupCreate from "src/app/views/GroupCreate.svelte"
  import GroupDelete from "src/app/views/GroupDelete.svelte"
  import GroupDetail from "src/app/views/GroupDetail.svelte"
  import GroupEdit from "src/app/views/GroupEdit.svelte"
  import GroupInfo from "src/app/views/GroupInfo.svelte"
  import GroupList from "src/app/views/GroupList.svelte"
  import GroupRotate from "src/app/views/GroupRotate.svelte"
  import Help from "src/app/views/Help.svelte"
  import Home from "src/app/views/Home.svelte"
  import InviteAccept from "src/app/views/InviteAccept.svelte"
  import InviteCreate from "src/app/views/InviteCreate.svelte"
  import LabelCreate from "src/app/views/LabelCreate.svelte"
  import ListCreate from "src/app/views/ListCreate.svelte"
  import ListDetail from "src/app/views/ListDetail.svelte"
  import ListEdit from "src/app/views/ListEdit.svelte"
  import ListList from "src/app/views/ListList.svelte"
  import ListSelect from "src/app/views/ListSelect.svelte"
  import ListingDelete from "src/app/views/ListingDelete.svelte"
  import ListingEdit from "src/app/views/ListingEdit.svelte"
  import Login from "src/app/views/Login.svelte"
  import LoginBunker from "src/app/views/LoginBunker.svelte"
  import LoginConnect from "src/app/views/LoginConnect.svelte"
  import LoginPrivKey from "src/app/views/LoginPrivKey.svelte"
  import LoginPubKey from "src/app/views/LoginPubKey.svelte"
  import Logout from "src/app/views/Logout.svelte"
  import Market from "src/app/views/Market.svelte"
  import MediaDetail from "src/app/views/MediaDetail.svelte"
  import NoteCreate from "src/app/views/NoteCreate.svelte"
  import NoteDelete from "src/app/views/NoteDelete.svelte"
  import NoteDetail from "src/app/views/NoteDetail.svelte"
  import Notifications from "src/app/views/Notifications.svelte"
  import Onboarding from "src/app/views/Onboarding.svelte"
  import PersonDetail from "src/app/views/PersonDetail.svelte"
  import PersonFollowers from "src/app/views/PersonFollowers.svelte"
  import PersonFollows from "src/app/views/PersonFollows.svelte"
  import PersonInfo from "src/app/views/PersonInfo.svelte"
  import PersonList from "src/app/shared/PersonList.svelte"
  import Publishes from "src/app/views/Publishes.svelte"
  import QRCode from "src/app/views/QRCode.svelte"
  import RelayDetail from "src/app/views/RelayDetail.svelte"
  import RelayList from "src/app/views/RelayList.svelte"
  import RelayReview from "src/app/views/RelayReview.svelte"
  import ReportCreate from "src/app/views/ReportCreate.svelte"
  import Search from "src/app/views/Search.svelte"
  import ThreadDetail from "src/app/views/ThreadDetail.svelte"
  import UserContent from "src/app/views/UserContent.svelte"
  import UserData from "src/app/views/UserData.svelte"
  import UserKeys from "src/app/views/UserKeys.svelte"
  import UserProfile from "src/app/views/UserProfile.svelte"
  import UserSettings from "src/app/views/UserSettings.svelte"
  import Zap from "src/app/views/Zap.svelte"
  import {isNil} from "ramda"
  import {onMount} from "svelte"
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
    asNote,
    asRelay,
    asEntity,
  } from "src/app/util/router"
  import {initializeDeepLinkHandler} from "../services/deepLinkHandler"

  const {session, pubkey} = app

  // Routes

  router.register("/about", About)
  router.register("/search", Search)
  router.register("/events", Calendar)

  router.register("/channels", ChannelsList, {
    requireSigner: true,
  })
  router.register("/channels/create", ChannelCreate, {
    requireSigner: true,
  })
  router.register("/channels/requests", ChannelsList, {
    requireSigner: true,
  })
  router.register("/channels/:channelId", ChannelsDetail, {
    requireSigner: true,
    serializers: {
      channelId: asChannelId,
    },
  })

  router.register("/events/:address", EventDetail, {
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.register("/events/:address/edit", EventEdit, {
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.register("/events/:address/delete", EventDelete, {
    serializers: {
      address: asNaddr("address"),
    },
  })

  router.register("/groups", GroupList)
  router.register("/groups/new", GroupCreate, {
    requireSigner: true,
  })
  router.register("/groups/:address/edit", GroupEdit, {
    requireSigner: true,
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.register("/groups/:address/delete", GroupDelete, {
    requireSigner: true,
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.register("/groups/:address/info", GroupInfo, {
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.register(
    "/groups/:address/invite-admin",
    import("src/app/views/GroupInviteAdmin.svelte"),
    {
      serializers: {
        address: asNaddr("address"),
      },
    },
  )
  router.register("/groups/:address/rotate", GroupRotate, {
    requireSigner: true,
    serializers: {
      address: asNaddr("address"),
      addMembers: asCsv("addMembers"),
      removeMembers: asCsv("removeMembers"),
    },
  })
  router.register("/groups/:address/:activeTab", GroupDetail, {
    serializers: {
      address: asNaddr("address"),
      claim: asString("claim"),
    },
  })
  router.register("/groups/:address", GroupDetail, {
    serializers: {
      address: asNaddr("address"),
      claim: asString("claim"),
    },
  })

  router.register("/help/:topic", Help)

  router.register("/invite", InviteAccept, {
    serializers: {
      people: asCsv("people"),
      relays: asCsv("relays"),
      groups: asCsv("groups"),
    },
  })
  router.register("/invite/create", InviteCreate, {
    serializers: {
      initialPubkey: asUrlComponent("initialPubkey"),
      initialGroupAddress: asUrlComponent("initialGroupAddress"),
    },
  })

  router.register("/feeds", FeedList)
  router.register("/feeds/create", FeedCreate)
  router.register("/feeds/:address", FeedEdit, {
    serializers: {
      address: asNaddr("address"),
    },
  })

  router.register("/lists", ListList)
  router.register("/lists/create", ListCreate)
  router.register("/lists/:address", ListDetail, {
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.register("/lists/:address/edit", ListEdit, {
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.register("/lists/select", ListSelect, {
    serializers: {
      type: asString("type"),
      value: asString("value"),
    },
  })

  router.register("/login", Login)
  router.register("/login/bunker", LoginBunker)
  router.register("/login/privkey", LoginPrivKey)
  router.register("/login/pubkey", LoginPubKey)
  router.register("/login/connect", LoginConnect, {
    requireUser: true,
  })
  router.register("/logout", Logout)

  router.register("/listings", Market)
  router.register("/listings/:address/edit", ListingEdit, {
    requireSigner: true,
    serializers: {
      address: asNaddr("address"),
    },
  })
  router.register("/listings/:address/delete", ListingDelete, {
    requireSigner: true,
    serializers: {
      address: asNaddr("address"),
    },
  })

  router.register("/media/:url", MediaDetail, {
    serializers: {
      url: asUrlComponent("url"),
    },
  })

  router.register("/", Home)
  router.register("/notes", Home)
  router.register("/notes/create", NoteCreate, {
    requireSigner: true,
    serializers: {
      pubkey: asPerson,
      group: asNaddr("group"),
      type: asString("type"),
    },
  })
  router.register("/notes/:entity", NoteDetail, {
    serializers: {
      entity: asNote,
    },
  })
  router.register("/notes/:entity/label", LabelCreate, {
    serializers: {
      entity: asNote,
    },
  })
  router.register("/notes/:entity/report", ReportCreate, {
    serializers: {
      entity: asNote,
    },
  })
  router.register("/notes/:entity/thread", ThreadDetail, {
    serializers: {
      entity: asNote,
    },
  })
  router.register("/notes/:entity/delete", NoteDelete, {
    serializers: {
      entity: asNote,
      kind: asString("kind"),
    },
  })

  router.register("/notifications", Notifications, {
    requireUser: true,
  })
  router.register("/notifications/:activeTab", Notifications, {
    requireUser: true,
  })

  router.register("/signup", Onboarding)

  router.register("/people/list", PersonList, {
    serializers: {
      pubkeys: asCsv("pubkeys"),
    },
  })
  router.register("/people/:entity", PersonDetail, {
    required: ["pubkey"],
    serializers: {
      entity: asPerson,
    },
  })
  router.register("/people/:entity/followers", PersonFollowers, {
    required: ["pubkey"],
    serializers: {
      entity: asPerson,
    },
  })
  router.register("/people/:entity/follows", PersonFollows, {
    required: ["pubkey"],
    serializers: {
      entity: asPerson,
    },
  })
  router.register("/people/:entity/info", PersonInfo, {
    required: ["pubkey"],
    serializers: {
      entity: asPerson,
    },
  })

  router.register("/qrcode/:code", QRCode, {
    serializers: {
      code: asUrlComponent("code"),
    },
  })

  router.register("/publishes", Publishes)

  router.register("/relays/:entity", RelayDetail, {
    serializers: {
      entity: asRelay,
    },
  })
  router.register("/relays/:entity/review", RelayReview, {
    serializers: {
      entity: asRelay,
    },
  })

  router.register("/settings", UserSettings, {
    requireUser: true,
  })
  router.register("/settings/content", UserContent, {
    requireUser: true,
  })
  router.register("/settings/data", UserData, {
    requireUser: true,
  })
  router.register("/settings/data/export", DataExport, {
    requireUser: true,
  })
  router.register("/settings/data/import", DataImport, {
    requireUser: true,
  })
  router.register("/settings/keys", UserKeys, {
    requireUser: true,
  })
  router.register("/settings/profile", UserProfile, {
    requireUser: true,
  })
  router.register("/settings/relays", RelayList)

  router.register("/zap", Zap, {
    required: ["splits"],
    serializers: {
      id: asNote,
      amount: asJson("amount"),
      splits: asJson("splits"),
      anonymous: asJson("anonymous"),
    },
  })

  router.register("/:entity", Bech32Entity, {
    serializers: {
      entity: asEntity,
    },
  })
  router.register("/:entity/*", Bech32Entity, {
    serializers: {
      entity: asEntity,
    },
  })

  router.init()

  // Globals
  ;(window as any).g = {
    ...domain,
    ...engine,
    nip19,
    store,
    logger,
    router,
    nostr,
    misc,
    network,
    util,
    lib,
    app,
  }

  // Theme

  const style = document.createElement("style")

  document.head.append(style)

  $: style.textContent = `:root { ${$themeVariables}; background: var(--neutral-800); }`

  // Scroll position

  let scrollY

  const unsubHistory = router.history.subscribe($history => {
    if ($history[0].modal) {
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
      lib.memoize($page => {
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

  lib.ctx.net.pool.on("init", connection => {
    app.loadRelay(connection.url)
    app.trackRelayStats(connection)
  })

  // App data boostrap and relay meta fetching

  ready.then(async () => {
    // Our stores are throttled by 300, so wait until they're populated
    // before loading app data
    await lib.sleep(350)

    loadAppData()

    if ($session) {
      loadUserData()
    }

    const interval1 = setInterval(() => {
      slowConnections.set(
        app.getPubkeyRelays($pubkey).filter(url => app.getRelayQuality(url) < 0.5),
      )

      // Prune connections we haven't used in a while
      for (const [_, connection] of lib.ctx.net.pool.data.entries()) {
        const {lastOpen, lastPublish, lastRequest, lastFault} = connection.meta
        const lastActivity = lib.max([lastOpen, lastPublish, lastRequest, lastFault])

        if (lastActivity < Date.now() - 30_000) {
          connection.disconnect()
        }
      }
    }, 5_000)

    return () => {
      clearInterval(interval1)
    }
  })

  onMount(() => {
    initializeDeepLinkHandler()
  })
</script>

{#await ready}
  <!-- pass -->
{:then}
  <div class="text-tinted-200">
    <Routes />
    {#key $pubkey}
      <ForegroundButtons />
      <Nav />
      <Menu />
      <Toast />
    {/key}
  </div>
{/await}
