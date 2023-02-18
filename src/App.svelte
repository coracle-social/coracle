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
  import messages from "src/app/messages"
  import {modal, toast, settings, routes, menuIsOpen, logUsage} from "src/app/ui"
  import RelayCard from "src/partials/RelayCard.svelte"
  import Anchor from 'src/partials/Anchor.svelte'
  import Content from 'src/partials/Content.svelte'
  import EnsureData from 'src/partials/EnsureData.svelte'
  import Modal from 'src/partials/Modal.svelte'
  import SideNav from 'src/partials/SideNav.svelte'
  import Spinner from 'src/partials/Spinner.svelte'
  import TopNav from 'src/partials/TopNav.svelte'
  import ChatEdit from "src/views/ChatEdit.svelte"
  import NoteCreate from "src/views/NoteCreate.svelte"
  import NoteDetail from "src/views/NoteDetail.svelte"
  import PersonList from "src/views/PersonList.svelte"
  import PersonSettings from "src/views/PersonSettings.svelte"
  import PersonShare from "src/views/PersonShare.svelte"
  import PrivKeyLogin from "src/views/PrivKeyLogin.svelte"
  import PubKeyLogin from "src/views/PubKeyLogin.svelte"
  import ConnectUser from "src/views/ConnectUser.svelte"
  import SignUp from "src/views/SignUp.svelte"
  import AddRelay from "src/routes/AddRelay.svelte"
  import Alerts from "src/routes/Alerts.svelte"
  import Bech32Entity from "src/routes/Bech32Entity.svelte"
  import Chat from "src/routes/Chat.svelte"
  import ChatRoom from "src/routes/ChatRoom.svelte"
  import Debug from "src/routes/Debug.svelte"
  import Keys from "src/routes/Keys.svelte"
  import Login from "src/routes/Login.svelte"
  import Logout from "src/routes/Logout.svelte"
  import Messages from "src/routes/Messages.svelte"
  import NotFound from "src/routes/NotFound.svelte"
  import Notes from "src/routes/Notes.svelte"
  import Person from "src/routes/Person.svelte"
  import Profile from "src/routes/Profile.svelte"
  import RelayList from "src/routes/RelayList.svelte"
  import Search from "src/routes/Search.svelte"
  import Settings from "src/routes/Settings.svelte"

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
        const {dufflepudUrl} = $settings

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
          <Notes activeTab={params.activeTab} />
        </EnsureData>
      </Route>
      <Route path="/people/:npub/:activeTab" let:params>
        {#key params.npub}
        <Person npub={params.npub} activeTab={params.activeTab} />
        {/key}
      </Route>
      <Route path="/chat" component={Chat} />
      <Route path="/chat/:entity" let:params>
        {#key params.entity}
        <ChatRoom entity={params.entity} />
        {/key}
      </Route>
      <Route path="/messages/:entity" let:params>
        {#key params.entity}
        <Messages entity={params.entity} />
        {/key}
      </Route>
      <Route path="/keys" component={Keys} />
      <Route path="/relays" component={RelayList} />
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
      {:else if $modal.type === 'relay/list'}
        <Content>
          {#each $modal.relays as relay}
          <RelayCard theme="black" showControls {relay} />
          {/each}
        </Content>
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

    {#if $toast}
      <div
        class="fixed top-0 left-0 right-0 z-10 pointer-events-none"
        transition:fly={{y: -50, duration: 300}}>
        <div
          class="rounded bg-accent shadow-xl mx-24 sm:mx-32 mt-2 p-3 text-white text-center
                 border border-dark pointer-events-all">
          {#if is(String, $toast.message)}
          {$toast.message}
          {:else}
          <div>
            {$toast.message.text}
            {#if $toast.message.link}
            <a class="ml-1 underline" href={$toast.message.link.href}>
              {$toast.message.link.text}
            </a>
            {/if}
          </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</Router>

