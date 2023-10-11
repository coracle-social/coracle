<script lang="ts">
  import {isNil, reverse} from "ramda"
  import {onMount} from "svelte"
  import {memoize} from "src/util/misc"
  import type {HistoryItem} from "src/util/router"
  import {decodeQueryString, decodeRouteParams} from "src/util/router"
  import Modal from "src/partials/Modal.svelte"
  import About from "src/app/views/About.svelte"
  import Apps from "src/app/views/Apps.svelte"
  import Bech32Entity from "src/app/views/Bech32Entity.svelte"
  import ChannelCreate from "src/app/views/ChannelCreate.svelte"
  import ChannelsDetail from "src/app/views/ChannelsDetail.svelte"
  import ChannelsList from "src/app/views/ChannelsList.svelte"
  import ChatRedirect from "src/app/views/ChatRedirect.svelte"
  import DataExport from "src/app/views/DataExport.svelte"
  import DataImport from "src/app/views/DataImport.svelte"
  import Explore from "src/app/views/Explore.svelte"
  import Help from "src/app/views/Help.svelte"
  import Feeds from "src/app/views/Feeds.svelte"
  import LabelCreate from "src/app/views/LabelCreate.svelte"
  import LabelDetail from "src/app/views/LabelDetail.svelte"
  import ListEdit from "src/app/views/ListEdit.svelte"
  import ListList from "src/app/views/ListList.svelte"
  import ListSelect from "src/app/views/ListSelect.svelte"
  import Login from "src/app/views/Login.svelte"
  import LoginAdvanced from "src/app/views/LoginAdvanced.svelte"
  import LoginBunker from "src/app/views/LoginBunker.svelte"
  import LoginConnect from "src/app/views/LoginConnect.svelte"
  import LoginPrivKey from "src/app/views/LoginPrivKey.svelte"
  import LoginPubKey from "src/app/views/LoginPubKey.svelte"
  import Logout from "src/app/views/Logout.svelte"
  import MessagesDetail from "src/app/views/MessagesDetail.svelte"
  import MessagesList from "src/app/views/MessagesList.svelte"
  import ModalMessage from "src/app/views/ModalMessage.svelte"
  import NoteCreate from "src/app/views/NoteCreate.svelte"
  import NoteDetail from "src/app/views/NoteDetail.svelte"
  import Notifications from "src/app/views/Notifications.svelte"
  import Onboarding from "src/app/views/Onboarding.svelte"
  import PersonDetail from "src/app/views/PersonDetail.svelte"
  import PersonInfo from "src/app/views/PersonInfo.svelte"
  import PersonFollows from "src/app/shared/PersonFollows.svelte"
  import PersonFollowers from "src/app/shared/PersonFollowers.svelte"
  import PersonList from "src/app/shared/PersonList.svelte"
  import PersonZap from "src/app/views/PersonZap.svelte"
  import PublishInfo from "src/app/views/PublishInfo.svelte"
  import QRCode from "src/app/views/QRCode.svelte"
  import MediaDetail from "src/app/views/MediaDetail.svelte"
  import RelayBrowse from "src/app/views/RelayBrowse.svelte"
  import RelayDetail from "src/app/views/RelayDetail.svelte"
  import RelayList from "src/app/views/RelayList.svelte"
  import RelayReview from "src/app/views/RelayReview.svelte"
  // import ReportCreate from "src/app/views/ReportCreate.svelte"
  import ThreadDetail from "src/app/views/ThreadDetail.svelte"
  import TopicFeed from "src/app/views/TopicFeed.svelte"
  import UserContent from "src/app/views/UserContent.svelte"
  import UserData from "src/app/views/UserData.svelte"
  import UserKeys from "src/app/views/UserKeys.svelte"
  import UserProfile from "src/app/views/UserProfile.svelte"
  import UserSettings from "src/app/views/UserSettings.svelte"
  import {menuIsOpen, logUsage} from "src/app/state"
  import {
    router,
    asChannelId,
    asPerson,
    asCsv,
    asString,
    asMedia,
    asFilter,
    asNote,
    asRelays,
    asRelay,
    asEntity,
  } from "src/app/router"

  // Routes

  router.register("/about", About)
  router.register("/apps", Apps)
  router.register("/bech32", Bech32Entity)

  router.register("/channels", ChannelsList)
  router.register("/channels/create", ChannelCreate)
  router.register("/channels/requests", ChannelsList)
  router.register("/channels/:channelId", ChannelsDetail, {
    channelId: asChannelId,
  })

  router.register("/chat/redirect", ChatRedirect)

  router.register("/conversations", MessagesList)
  router.register("/conversations/requests", MessagesList)
  router.register("/conversations/:entity", MessagesDetail, {
    entity: asPerson,
  })

  router.register("/explore", Explore)

  router.register("/help/:topic", Help)

  router.register("/labels/:label", LabelDetail, {
    ids: asCsv("ids"),
  })

  router.register("/lists", ListList)
  router.register("/lists/create", ListEdit)
  router.register("/lists/select", ListSelect, {
    type: asString("type"),
    value: asString("value"),
  })
  router.register("/lists/:naddr", ListEdit)

  router.register("/login/advanced", LoginAdvanced)
  router.register("/login/bunker", LoginBunker)
  router.register("/login/connect", LoginConnect)
  router.register("/login/intro", Login)
  router.register("/login/privkey", LoginPrivKey)
  router.register("/login/pubkey", LoginPubKey)
  router.register("/logout", Logout)

  router.register("/media/:url", MediaDetail, {
    url: asMedia("url"),
  })

  router.register("/message", ModalMessage)

  router.register("/", Feeds, {
    filter: asFilter,
  })
  router.register("/notes", Feeds, {
    filter: asFilter,
  })
  router.register("/notes/create", NoteCreate, {
    pubkey: asPerson,
  })
  router.register("/notes/:entity", NoteDetail, {
    entity: asNote,
  })
  router.register("/notes/:entity/label", LabelCreate, {
    entity: asNote,
  })
  router.register("/notes/:entity/status", PublishInfo, {
    entity: asNote,
    relays: asRelays,
  })
  router.register("/notes/:entity/thread", ThreadDetail, {
    entity: asNote,
  })
  // router.register("/notes/:entity/report", ReportCreate, {
  //   entity: asNote,
  //   pubkey: asPerson,
  // })

  router.register("/notifications", Notifications)
  router.register("/notifications/:activeTab", Notifications)

  router.register("/onboarding", Onboarding)

  router.register("/people/list", PersonList, {
    pubkeys: asCsv("pubkeys"),
  })
  router.register("/people/:entity", PersonDetail, {
    entity: asPerson,
    filter: asFilter,
  })
  router.register("/people/:entity/followers", PersonFollowers, {
    entity: asPerson,
  })
  router.register("/people/:entity/follows", PersonFollows, {
    entity: asPerson,
  })
  router.register("/people/:entity/info", PersonInfo, {
    entity: asPerson,
  })
  router.register("/people/:entity/zap", PersonZap, {
    entity: asPerson,
    eid: asNote,
  })

  router.register("/qrcode/:code", QRCode)

  router.register("/relays/browse", RelayBrowse)
  router.register("/relays/:entity", RelayDetail, {
    entity: asRelay,
  })
  router.register("/relays/:entity/review", RelayReview, {
    entity: asRelay,
  })

  router.register("/settings", UserSettings)
  router.register("/settings/content", UserContent)
  router.register("/settings/data", UserData)
  router.register("/settings/data/export", DataExport)
  router.register("/settings/data/import", DataImport)
  router.register("/settings/keys", UserKeys)
  router.register("/settings/profile", UserProfile)
  router.register("/settings/relays", RelayList)

  router.register("/topics/:topic", TopicFeed)

  router.register("/:entity", Bech32Entity, {
    entity: asEntity,
    filter: asFilter,
  })
  router.register("/:entity/*", Bech32Entity, {
    entity: asEntity,
    filter: asFilter,
  })

  router.init()

  const {page, modal, modals} = router

  const closeModal = async () => {
    router.pop()
    menuIsOpen.set(false)
  }

  const getProps = (item: HistoryItem) => ({
    ...item.config.context,
    ...decodeQueryString(item),
    ...decodeRouteParams(item),
  })

  let scrollY

  $: {
    if ($modal) {
      console.log("modal", $modal, getProps($modal))
    } else {
      console.log("page", $page, getProps($page))
    }
  }

  $: {
    if ($modal) {
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
  }

  onMount(() => {
    const unsubPage = page.subscribe(
      memoize($page => {
        logUsage(btoa($page.path))
        window.scrollTo(0, 0)
      })
    )

    const unsubModal = modal.subscribe($modal => {
      if ($modal) {
        logUsage(btoa($modal.path))
      }
    })

    const unsubRouter = router.listen()

    return () => {
      unsubPage()
      unsubModal()
      unsubRouter()
    }
  })
</script>

<div class="pt-16 text-gray-2 lg:ml-48" class:pointer-events-none={$menuIsOpen}>
  {#if $page}
    {#key $page.path}
      <svelte:component this={$page.route.component} {...getProps($page)} />
    {/key}
  {/if}
</div>

{#each reverse($modals).filter(m => !m.config.virtual) as m, i (m.path + i)}
  <Modal
    index={i}
    virtual={false}
    isOnTop={m === $modal}
    onEscape={m.config.noEscape ? null : closeModal}>
    <svelte:component this={m.route.component} {...getProps(m)} />
  </Modal>
{/each}
