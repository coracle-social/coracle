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

  const About = lib.memoize(() => import("src/app/views/About.svelte"))
  const Bech32Entity = lib.memoize(() => import("src/app/views/Bech32Entity.svelte"))
  const Calendar = lib.memoize(() => import("src/app/views/Calendar.svelte"))
  const ChannelCreate = lib.memoize(() => import("src/app/views/ChannelCreate.svelte"))
  const ChannelsDetail = lib.memoize(() => import("src/app/views/ChannelsDetail.svelte"))
  const ChannelsList = lib.memoize(() => import("src/app/views/ChannelsList.svelte"))
  const DataExport = lib.memoize(() => import("src/app/views/DataExport.svelte"))
  const DataImport = lib.memoize(() => import("src/app/views/DataImport.svelte"))
  const EventDelete = lib.memoize(() => import("src/app/views/EventDelete.svelte"))
  const EventDetail = lib.memoize(() => import("src/app/views/EventDetail.svelte"))
  const EventEdit = lib.memoize(() => import("src/app/views/EventEdit.svelte"))
  const FeedCreate = lib.memoize(() => import("src/app/views/FeedCreate.svelte"))
  const FeedEdit = lib.memoize(() => import("src/app/views/FeedEdit.svelte"))
  const FeedList = lib.memoize(() => import("src/app/views/FeedList.svelte"))
  const GroupCreate = lib.memoize(() => import("src/app/views/GroupCreate.svelte"))
  const GroupDelete = lib.memoize(() => import("src/app/views/GroupDelete.svelte"))
  const GroupDetail = lib.memoize(() => import("src/app/views/GroupDetail.svelte"))
  const GroupEdit = lib.memoize(() => import("src/app/views/GroupEdit.svelte"))
  const GroupInfo = lib.memoize(() => import("src/app/views/GroupInfo.svelte"))
  const GroupList = lib.memoize(() => import("src/app/views/GroupList.svelte"))
  const GroupRotate = lib.memoize(() => import("src/app/views/GroupRotate.svelte"))
  const Help = lib.memoize(() => import("src/app/views/Help.svelte"))
  const Home = lib.memoize(() => import("src/app/views/Home.svelte"))
  const InviteAccept = lib.memoize(() => import("src/app/views/InviteAccept.svelte"))
  const InviteCreate = lib.memoize(() => import("src/app/views/InviteCreate.svelte"))
  const LabelCreate = lib.memoize(() => import("src/app/views/LabelCreate.svelte"))
  const ListCreate = lib.memoize(() => import("src/app/views/ListCreate.svelte"))
  const ListDetail = lib.memoize(() => import("src/app/views/ListDetail.svelte"))
  const ListEdit = lib.memoize(() => import("src/app/views/ListEdit.svelte"))
  const ListList = lib.memoize(() => import("src/app/views/ListList.svelte"))
  const ListSelect = lib.memoize(() => import("src/app/views/ListSelect.svelte"))
  const ListingDelete = lib.memoize(() => import("src/app/views/ListingDelete.svelte"))
  const ListingEdit = lib.memoize(() => import("src/app/views/ListingEdit.svelte"))
  const Login = lib.memoize(() => import("src/app/views/Login.svelte"))
  const LoginBunker = lib.memoize(() => import("src/app/views/LoginBunker.svelte"))
  const LoginConnect = lib.memoize(() => import("src/app/views/LoginConnect.svelte"))
  const LoginPrivKey = lib.memoize(() => import("src/app/views/LoginPrivKey.svelte"))
  const LoginPubKey = lib.memoize(() => import("src/app/views/LoginPubKey.svelte"))
  const Logout = lib.memoize(() => import("src/app/views/Logout.svelte"))
  const Market = lib.memoize(() => import("src/app/views/Market.svelte"))
  const MediaDetail = lib.memoize(() => import("src/app/views/MediaDetail.svelte"))
  const NoteCreate = lib.memoize(() => import("src/app/views/NoteCreate.svelte"))
  const NoteDelete = lib.memoize(() => import("src/app/views/NoteDelete.svelte"))
  const NoteDetail = lib.memoize(() => import("src/app/views/NoteDetail.svelte"))
  const Notifications = lib.memoize(() => import("src/app/views/Notifications.svelte"))
  const Onboarding = lib.memoize(() => import("src/app/views/Onboarding.svelte"))
  const PersonDetail = lib.memoize(() => import("src/app/views/PersonDetail.svelte"))
  const PersonFollowers = lib.memoize(() => import("src/app/views/PersonFollowers.svelte"))
  const PersonFollows = lib.memoize(() => import("src/app/views/PersonFollows.svelte"))
  const PersonInfo = lib.memoize(() => import("src/app/views/PersonInfo.svelte"))
  const PersonList = lib.memoize(() => import("src/app/shared/PersonList.svelte"))
  const Publishes = lib.memoize(() => import("src/app/views/Publishes.svelte"))
  const QRCode = lib.memoize(() => import("src/app/views/QRCode.svelte"))
  const RelayDetail = lib.memoize(() => import("src/app/views/RelayDetail.svelte"))
  const RelayList = lib.memoize(() => import("src/app/views/RelayList.svelte"))
  const RelayReview = lib.memoize(() => import("src/app/views/RelayReview.svelte"))
  const ReportCreate = lib.memoize(() => import("src/app/views/ReportCreate.svelte"))
  const Search = lib.memoize(() => import("src/app/views/Search.svelte"))
  const ThreadDetail = lib.memoize(() => import("src/app/views/ThreadDetail.svelte"))
  const TopicFeed = lib.memoize(() => import("src/app/views/TopicFeed.svelte"))
  const UserContent = lib.memoize(() => import("src/app/views/UserContent.svelte"))
  const UserData = lib.memoize(() => import("src/app/views/UserData.svelte"))
  const UserKeys = lib.memoize(() => import("src/app/views/UserKeys.svelte"))
  const UserProfile = lib.memoize(() => import("src/app/views/UserProfile.svelte"))
  const UserSettings = lib.memoize(() => import("src/app/views/UserSettings.svelte"))
  const Zap = lib.memoize(() => import("src/app/views/Zap.svelte"))
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

  router.register("/topics/:topic", TopicFeed)

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
