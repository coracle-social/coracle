<script lang="ts">
  import {nip19} from "nostr-tools"
  import {isNil, reverse} from "ramda"
  import {onMount} from "svelte"
  import {memoize, tryJson} from "src/util/misc"
  import {fromNostrURI} from "src/util/nostr"
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
  import {decodePerson, decodeRelay, decodeEvent, selectHints} from "src/engine"
  import {menuIsOpen, logUsage} from "src/app/state"
  import {router} from "src/app/router"

  router.register("/about", About)
  router.register("/apps", Apps)
  router.register("/bech32", Bech32Entity)
  router.register("/chat/redirect", ChatRedirect)
  router.register("/requests", MessagesList)
  router.register("/conversations", MessagesList)
  router.register("/conversations/:entity", MessagesDetail)
  router.register("/explore", Explore)
  router.register("/labels/:label", LabelDetail)
  router.register("/login/intro", Login)
  router.register("/login/advanced", LoginAdvanced)
  router.register("/login/bunker", LoginBunker)
  router.register("/login/connect", LoginConnect)
  router.register("/login/privkey", LoginPrivKey)
  router.register("/login/pubkey", LoginPubKey)
  router.register("/logout", Logout)
  router.register("/qrcode/:code", QRCode)
  router.register("/notifications", Notifications)
  router.register("/notifications/:activeTab", Notifications)
  router.register("/onboarding", Onboarding)
  router.register("/messages/requests", MessagesList)
  router.register("/messages/:id", MessagesDetail)
  router.register("/settings", UserSettings)
  router.register("/settings/keys", UserKeys)
  router.register("/settings/relays", RelayList)
  router.register("/settings/profile", UserProfile)
  router.register("/settings/content", UserContent)
  router.register("/settings/data", UserData)
  router.register("/settings/data/export", DataExport)
  router.register("/settings/data/import", DataImport)
  router.register("/topic/:topic", TopicFeed)

  const mediaRouteOpts = {
    decode: {
      url: v => ({url: atob(v)}),
    },
  }

  router.register("/media/:url", MediaDetail, mediaRouteOpts)

  const listsRouteOpts = {
    decode: {
      list: json => tryJson(() => JSON.parse(json)),
    },
  }

  router.register("/lists", ListList)
  router.register("/lists/select", ListSelect)
  router.register("/lists/create", ListEdit)
  router.register("/lists/:naddr", ListEdit, listsRouteOpts)

  const channelsRouteOpts = {
    decode: {
      entity: channelId => ({pubkeys: channelId.split(",")}),
    },
  }

  router.register("/channels", ChannelsList)
  router.register("/channels/requests", ChannelsList)
  router.register("/channels/create", ChannelCreate)
  router.register("/channels/:entity", ChannelsDetail, channelsRouteOpts)

  const notesRouteOpts = {
    decode: {
      entity: decodeEvent,
      relays: s => ({relays: s.split(",")}),
    },
  }

  router.register("/", Feeds)
  router.register("/notes", Feeds)
  router.register("/notes/create", NoteCreate)
  router.register("/notes/:entity", NoteDetail, notesRouteOpts)
  router.register("/notes/:entity/thread", ThreadDetail, notesRouteOpts)
  // router.register("/notes/:entity/report", ReportCreate)
  router.register("/notes/:entity/label", LabelCreate)
  router.register("/notes/:entity/status", PublishInfo)

  const peopleRouteOpts = {
    decode: {
      entity: decodePerson,
      relays: s => ({relays: s.split(",")}),
      pubkeys: s => ({pubkeys: s.split(",")}),
    },
  }

  router.register("/people/:entity", PersonDetail, peopleRouteOpts)
  router.register("/people/:entity/detail", PersonDetail, peopleRouteOpts)
  router.register("/people/:entity/followers", PersonFollowers, peopleRouteOpts)
  router.register("/people/:entity/follows", PersonFollows, peopleRouteOpts)
  router.register("/people/:entity/info", PersonInfo, peopleRouteOpts)
  router.register("/people/:entity/list", PersonList, peopleRouteOpts)
  router.register("/people/:entity/zap", PersonZap, peopleRouteOpts)

  const relayRouteOpts = {
    decode: {
      entity: decodeRelay,
    },
  }

  router.register("/relays/browse", RelayBrowse)
  router.register("/relays/:entity", RelayDetail, relayRouteOpts)
  router.register("/relays/:entity/review", RelayReview, relayRouteOpts)

  const entityRouteOpts = {
    decode: {
      entity: entity => {
        entity = fromNostrURI(entity)

        let type, data, relays

        try {
          ;({type, data} = nip19.decode(entity) as {type: string; data: any})
          relays = selectHints(data.relays || [], 3)
        } catch (e) {
          // pass
        }

        return {type, data, relays}
      },
    },
  }

  router.register("/:entity", Bech32Entity, entityRouteOpts)
  router.register("/:entity/*", Bech32Entity, entityRouteOpts)

  router.init()

  const {page, modal, modals} = router

  const closeModal = async () => {
    router.pop()
    menuIsOpen.set(false)
  }

  const getProps = ({config, path, params, route}) => {
    const data = {...config.context}

    for (const [k, v] of Object.entries(params)) {
      const decode = route.opts?.decode?.[k]

      data[k] = v

      if (decode) {
        Object.assign(data, decode(v))
      }
    }

    const [qs] = path.split("?").slice(1)

    if (qs) {
      for (const [k, v] of new URLSearchParams(qs)) {
        const decode = route.opts?.decode?.[k]

        data[k] = v

        if (decode) {
          Object.assign(data, decode(v))
        }
      }
    }

    return data
  }

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

{#each reverse($modals).filter(m => !m.config.virtual) as m, i (m.path)}
  <Modal
    index={i}
    virtual={false}
    isOnTop={m === $modal}
    onEscape={m.config.noEscape ? null : closeModal}>
    <svelte:component this={m.route.component} {...getProps(m)} />
  </Modal>
{/each}
