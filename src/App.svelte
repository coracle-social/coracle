<script lang="ts">
  import "@fortawesome/fontawesome-free/css/fontawesome.css"
  import "@fortawesome/fontawesome-free/css/solid.css"

  import {onMount} from 'svelte'
  import {Router, Route, links, navigate} from "svelte-routing"
  import {globalHistory} from "svelte-routing/src/history"
  import {cubicInOut} from "svelte/easing"
  import {writable, get} from "svelte/store"
  import {fly, fade} from "svelte/transition"
  import {createMap, first} from 'hurdak/lib/hurdak'
  import {find, is, identity, nthArg, pluck} from 'ramda'
  import {log, warn} from 'src/util/logger'
  import {timedelta, shuffle, now, sleep} from 'src/util/misc'
  import {displayPerson, isLike} from 'src/util/nostr'
  import cmd from 'src/agent/cmd'
  import database from 'src/agent/database'
  import keys from 'src/agent/keys'
  import network from 'src/agent/network'
  import pool from 'src/agent/pool'
  import {getUserRelays, initializeRelayList} from 'src/agent/relays'
  import sync from 'src/agent/sync'
  import user from 'src/agent/user'
  import {loadAppData} from "src/app"
  import alerts from "src/app/alerts"
  import {modal, routes, menuIsOpen, logUsage} from "src/app/ui"
  import AddRelay from "src/views/relays/AddRelay.svelte"
  import Alerts from "src/views/alerts/Alerts.svelte"
  import Anchor from 'src/partials/Anchor.svelte'
  import Bech32Entity from "src/views/Bech32Entity.svelte"
  import ChatDetail from "src/views/chat/ChatDetail.svelte"
  import ChatEdit from "src/views/chat/ChatEdit.svelte"
  import ChatList from "src/views/chat/ChatList.svelte"
  import ConnectUser from "src/views/login/ConnectUser.svelte"
  import Content from 'src/partials/Content.svelte'
  import Debug from "src/views/Debug.svelte"
  import EnsureData from 'src/partials/EnsureData.svelte'
  import Keys from "src/views/Keys.svelte"
  import Login from "src/views/login/Login.svelte"
  import Logout from "src/views/login/Logout.svelte"
  import MessagesDetail from "src/views/messages/MessagesDetail.svelte"
  import MessagesList from "src/views/messages/MessagesList.svelte"
  import Modal from 'src/partials/Modal.svelte'
  import NotFound from "src/views/NotFound.svelte"
  import NoteCreate from "src/views/notes/NoteCreate.svelte"
  import NoteDetail from "src/views/notes/NoteDetail.svelte"
  import NotesList from "src/views/notes/NotesList.svelte"
  import PersonDetail from "src/views/person/PersonDetail.svelte"
  import PersonList from "src/views/person/PersonList.svelte"
  import PersonSettings from "src/views/person/PersonSettings.svelte"
  import PersonShare from "src/views/person/PersonShare.svelte"
  import PrivKeyLogin from "src/views/login/PrivKeyLogin.svelte"
  import Profile from "src/views/Profile.svelte"
  import PubKeyLogin from "src/views/login/PubKeyLogin.svelte"
  import RelayCard from "src/views/relays/RelayCard.svelte"
  import RelayDetail from "src/views/relays/RelayDetail.svelte"
  import RelayList from "src/views/relays/RelayList.svelte"
  import Search from "src/views/search/Search.svelte"
  import Settings from "src/views/Settings.svelte"
  import SideNav from 'src/views/SideNav.svelte'
  import SignUp from "src/views/login/SignUp.svelte"
  import Spinner from 'src/partials/Spinner.svelte'
  import Toast from 'src/views/Toast.svelte'
  import TopNav from 'src/views/TopNav.svelte'

  Object.assign(window, {cmd, database, user, keys, network, pool, sync})

  export let url = ""

  let scrollY

  const {ready} = database

  const closeModal = async () => {
    modal.clear()
    menuIsOpen.set(false)
  }

  onMount(() => {
    // Keep scroll position on body, but don't allow scrolling
    const unsubModal = modal.subscribe($modal => {
      if ($modal) {
        logUsage(btoa(['modal', $modal.type].join(':')))

        // This is not idempotent, so don't duplicate it
        if (document.body.style.position !== 'fixed') {
          scrollY = window.scrollY

          document.body.style.top = `-${scrollY}px`
          document.body.style.position = `fixed`
        }
      } else {
        document.body.setAttribute('style', '')
        window.scrollTo(0, scrollY)
      }
    })

    // Log usage on navigate
    const unsubHistory = globalHistory.listen(({location}) => {
      if (!location.hash) {
        // Remove identifying information, e.g. pubkeys, event ids, etc
        const name = location.pathname.slice(1)
          .replace(/(npub|nprofile|note|nevent)[^\/]+/g, (_, m) => `<${m}>`)

        logUsage(btoa(['page', name].join(':')))
      }
    })

    return () => {
      unsubHistory()
      unsubModal()
    }
  })

  database.onReady(() => {
    initializeRelayList()

    if (user.getProfile()) {
      loadAppData(user.getPubkey())
    }

    const interval = setInterval(
      async () => {
        const {dufflepudUrl} = user.getSettings()

        if (!dufflepudUrl) {
          return
        }

        // Find relays with old/missing metadata and refresh them. Only pick a
        // few so we're not sending too many concurrent http requests
        const staleRelays = shuffle(
          await database.relays.all({
           'refreshed_at:lt': now() - timedelta(7, 'days'),
          })
        ).slice(0, 10)

        const freshRelays = await Promise.all(
          staleRelays.map(async ({url}) => {
            try {
              const res = await fetch(dufflepudUrl + '/relay/info', {
                method: 'POST',
                body: JSON.stringify({url}),
                headers: {
                  'Content-Type': 'application/json',
                },
              })

              return {...await res.json(), url, refreshed_at: now()}
            } catch (e) {
              if (!e.toString().includes('Failed to fetch')) {
                warn(e)
              }

              return {url, refreshed_at: now()}
            }
          })
        )

        database.relays.bulkPatch(createMap('url', freshRelays.filter(identity)))
      },
      30_000
    )

    return () => {
      clearInterval(interval)
    }
  })
</script>

<Router {url}>
  <div use:links class="h-full">
    {#if $ready}
    <div class="pt-16 text-white h-full lg:ml-56">
      <Route path="/alerts" component={Alerts} />
      <Route path="/search/:activeTab" let:params>
        <EnsureData enforcePeople={false}>
          <Search activeTab={params.activeTab} />
        </EnsureData>
      </Route>
      <Route path="/notes/:activeTab" let:params>
        <EnsureData>
          <NotesList activeTab={params.activeTab} />
        </EnsureData>
      </Route>
      <Route path="/people/:npub/:activeTab" let:params>
        {#key params.npub}
        <PersonDetail npub={params.npub} activeTab={params.activeTab} />
        {/key}
      </Route>
      <Route path="/chat" component={ChatList} />
      <Route path="/chat/:entity" let:params>
        {#key params.entity}
        <ChatDetail entity={params.entity} />
        {/key}
      </Route>
      <Route path="/messages" component={MessagesList} />
      <Route path="/messages/:entity" let:params>
        {#key params.entity}
        <MessagesDetail entity={params.entity} />
        {/key}
      </Route>
      <Route path="/keys" component={Keys} />
      <Route path="/relays" component={RelayList} />
      <Route path="/relays/:b64url" let:params>
        {#key params.b64url}
        <RelayDetail url={atob(params.b64url)} />
        {/key}
      </Route>
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/login" component={Login} />
      <Route path="/logout" component={Logout} />
      <Route path="/debug" component={Debug} />
      <Route path="/:entity" let:params>
        {#key params.entity}
        <Bech32Entity entity={params.entity} />
        {/key}
      </Route>
      <Route path="*" component={NotFound} />
    </div>
    {/if}

    <SideNav />
    <TopNav />

    {#if $modal}
    <Modal onEscape={$modal.noEscape ? null : closeModal}>
      {#if $modal.type === 'note/detail'}
        {#key $modal.note.id}
        <NoteDetail {...$modal} />
        {/key}
      {:else if $modal.type === 'note/create'}
        <NoteCreate pubkey={$modal.pubkey} />
      {:else if $modal.type === 'relay/add'}
        <AddRelay />
      {:else if $modal.type === 'signUp'}
        <SignUp />
      {:else if $modal.type === 'room/edit'}
        <ChatEdit {...$modal} />
      {:else if $modal.type === 'login/privkey'}
        <PrivKeyLogin />
      {:else if $modal.type === 'login/pubkey'}
        <PubKeyLogin />
      {:else if $modal.type === 'login/connect'}
        <ConnectUser />
      {:else if $modal.type === 'person/settings'}
        <PersonSettings />
      {:else if $modal.type === 'person/share'}
        <PersonShare />
      {:else if $modal.type === 'person/list'}
        <PersonList pubkeys={$modal.pubkeys} />
      {:else if $modal.type === 'message'}
        <Content size="lg">
          <div class="text-center">{$modal.message}</div>
          {#if $modal.spinner}
          <Spinner delay={0} />
          {/if}
        </Content>
      {/if}
    </Modal>
    {/if}

    <Toast />
  </div>
</Router>

