<script lang="ts">
  import "@fortawesome/fontawesome-free/css/fontawesome.css"
  import "@fortawesome/fontawesome-free/css/solid.css"

  import {find, is, identity, nthArg, pluck} from 'ramda'
  import {createMap, first} from 'hurdak/lib/hurdak'
  import {writable, get} from "svelte/store"
  import {fly, fade} from "svelte/transition"
  import {cubicInOut} from "svelte/easing"
  import {Router, Route, links, navigate} from "svelte-routing"
  import {globalHistory} from "svelte-routing/src/history"
  import {log, warn} from 'src/util/logger'
  import {displayPerson, isLike} from 'src/util/nostr'
  import {timedelta, shuffle, now, sleep} from 'src/util/misc'
  import cmd from 'src/agent/cmd'
  import {user, getUserRelays} from 'src/agent/helpers'
  import database from 'src/agent/database'
  import keys from 'src/agent/keys'
  import network from 'src/agent/network'
  import pool from 'src/agent/pool'
  import sync from 'src/agent/sync'
  import {modal, toast, settings, logUsage, alerts, messages, loadAppData} from "src/app"
  import {routes} from "src/app/ui"
  import Anchor from 'src/partials/Anchor.svelte'
  import Content from 'src/partials/Content.svelte'
  import Spinner from 'src/partials/Spinner.svelte'
  import Modal from 'src/partials/Modal.svelte'
  import RelayCard from "src/partials/RelayCard.svelte"
  import SignUp from "src/views/SignUp.svelte"
  import PersonList from "src/views/PersonList.svelte"
  import PrivKeyLogin from "src/views/PrivKeyLogin.svelte"
  import PubKeyLogin from "src/views/PubKeyLogin.svelte"
  import NoteDetail from "src/views/NoteDetail.svelte"
  import PersonSettings from "src/views/PersonSettings.svelte"
  import PersonShare from "src/views/PersonShare.svelte"
  import NoteCreate from "src/views/NoteCreate.svelte"
  import ChatEdit from "src/views/ChatEdit.svelte"
  import NotFound from "src/routes/NotFound.svelte"
  import Search from "src/routes/Search.svelte"
  import Alerts from "src/routes/Alerts.svelte"
  import Notes from "src/routes/Notes.svelte"
  import Debug from "src/routes/Debug.svelte"
  import Login from "src/routes/Login.svelte"
  import Logout from "src/routes/Logout.svelte"
  import Profile from "src/routes/Profile.svelte"
  import Settings from "src/routes/Settings.svelte"
  import Keys from "src/routes/Keys.svelte"
  import RelayList from "src/routes/RelayList.svelte"
  import AddRelay from "src/routes/AddRelay.svelte"
  import Person from "src/routes/Person.svelte"
  import Bech32Entity from "src/routes/Bech32Entity.svelte"
  import Chat from "src/routes/Chat.svelte"
  import ChatRoom from "src/routes/ChatRoom.svelte"
  import Messages from "src/routes/Messages.svelte"

  Object.assign(window, {cmd, database, keys, network, pool, sync})

  export let url = ""

  const menuIsOpen = writable(false)
  const toggleMenu = () => menuIsOpen.update(x => !x)

  const searchIsOpen = writable(false)
  const toggleSearch = () => searchIsOpen.update(x => !x)

  const closeModal = async () => {
    modal.clear()
    menuIsOpen.set(false)
  }

  const {ready} = database
  const {lastCheckedAlerts, mostRecentAlert} = alerts
  const {lastCheckedByPubkey, mostRecentByPubkey} = messages

  let menuIcon
  let scrollY
  let suspendedSubs = []
  let slowConnections = []
  let hasNewMessages = false

  $: {
    hasNewMessages = Boolean(find(
      ([k, t]) => {
        return t > now() - timedelta(7, 'days') && ($lastCheckedByPubkey[k] || 0) < t
      },
      Object.entries($mostRecentByPubkey)
    ))
  }

  database.onReady(() => {
    if ($user) {
      loadAppData($user.pubkey)
    }

    // Background work
    const interval = setInterval(() => {
      alertSlowConnections()
      retrieveRelayMeta()
    }, 30_000)

    const alertSlowConnections = () => {
      // Only notify about relays the user is actually subscribed to
      const relayUrls = pluck('url', getUserRelays('read'))

      // Prune connections we haven't used in a while
      pool.getConnections()
        .filter(conn => conn.lastRequest < Date.now() - 60_000)
        .forEach(conn => conn.disconnect())

      // Log stats for debugging purposes
      log(
        'Connection stats',
        pool.getConnections()
          .map(c => `${c.nostr.url} ${c.getQuality().join(' ')}`)
      )

      // Alert the user to any heinously slow connections
      slowConnections = pool.getConnections()
        .filter(c => relayUrls.includes(c.nostr.url) && first(c.getQuality()) < 0.3)
    }

    const retrieveRelayMeta = async () => {
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
    }

    // Close menu on click outside
    document.querySelector("html").addEventListener("click", e => {
      if (e.target !== menuIcon) {
        menuIsOpen.set(false)
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

    return () => {
      clearInterval(interval)
      unsubHistory()
      unsubModal()
    }
  })
</script>

<Router {url}>
  <div use:links class="h-full">
    {#if $ready}
    <div class="pt-16 text-white h-full lg:ml-56">
      <Route path="/alerts" component={Alerts} />
      <Route path="/search/:activeTab" component={Search} />
      <Route path="/notes/:activeTab" component={Notes} />
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

    <ul
      class="py-20 w-56 bg-dark fixed top-0 bottom-0 left-0 transition-all shadow-xl
             border-r border-medium text-white overflow-hidden z-10 lg:ml-0"
      class:-ml-56={!$menuIsOpen}
    >
      {#if $user}
      <li>
        <a href={routes.person($user.pubkey)} class="flex gap-2 px-4 py-2 pb-6 items-center">
          <div
            class="overflow-hidden w-6 h-6 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
            style="background-image: url({$user.picture})" />
          <span class="text-lg font-bold">{displayPerson($user)}</span>
        </a>
      </li>
      <li class="cursor-pointer relative">
        <a class="block px-4 py-2 hover:bg-accent transition-all" href="/alerts">
          <i class="fa-solid fa-bell mr-2" /> Alerts
          {#if $mostRecentAlert > $lastCheckedAlerts}
          <div class="w-2 h-2 rounded bg-accent absolute top-3 left-6" />
          {/if}
        </a>
      </li>
      {/if}
      <li class="cursor-pointer">
        <a class="block px-4 py-2 hover:bg-accent transition-all" href="/search/people">
          <i class="fa-solid fa-search mr-2" /> Search
        </a>
      </li>
      <li class="cursor-pointer">
        <a class="block px-4 py-2 hover:bg-accent transition-all" href="/notes/network">
          <i class="fa-solid fa-tag mr-2" /> Notes
        </a>
      </li>
      {#if $user}
      <li class="cursor-pointer relative">
        <a class="block px-4 py-2 hover:bg-accent transition-all" href="/chat">
          <i class="fa-solid fa-message mr-2" /> Chat
          {#if hasNewMessages}
          <div class="w-2 h-2 rounded bg-accent absolute top-2 left-7" />
          {/if}
        </a>
      </li>
      {/if}
      <li class="h-px mx-3 my-4 bg-medium" />
      <li class="cursor-pointer relative">
        <a class="block px-4 py-2 hover:bg-accent transition-all" href="/relays">
          <i class="fa-solid fa-server mr-2" /> Relays
          {#if slowConnections.length > 0}
          <div class="w-2 h-2 rounded bg-accent absolute top-2 left-8" />
          {/if}
        </a>
      </li>
      {#if $user}
      <li class="cursor-pointer">
        <a class="block px-4 py-2 hover:bg-accent transition-all" href="/keys">
          <i class="fa-solid fa-key mr-2" /> Keys
        </a>
      </li>
      <li class="cursor-pointer">
        <a class="block px-4 py-2 hover:bg-accent transition-all" href="/settings">
          <i class="fa-solid fa-gear mr-2" /> Settings
        </a>
      </li>
      <li class="cursor-pointer">
        <a class="block px-4 py-2 hover:bg-accent transition-all" href="/logout">
          <i class="fa-solid fa-right-from-bracket mr-2" /> Logout
        </a>
      </li>
      {:else}
      <li class="cursor-pointer">
        <a class="block px-4 py-2 hover:bg-accent transition-all" href="/login">
          <i class="fa-solid fa-right-to-bracket mr-2" /> Login
        </a>
      </li>
      {/if}
      {#if import.meta.env.VITE_SHOW_DEBUG_ROUTE === 'true'}
      <li class="cursor-pointer">
        <a class="block px-4 py-2 hover:bg-accent transition-all" href="/debug">
          <i class="fa-solid fa-bug mr-2" /> Debug
        </a>
      </li>
      {/if}
    </ul>

    <div
      class="fixed top-0 bg-dark flex justify-between items-center text-white w-full p-4
                border-b border-medium z-10"
    >
      <div class="lg:hidden">
        <button class="fa-solid fa-bars fa-2xl cursor-pointer" bind:this={menuIcon} on:click={toggleMenu} />
      </div>
      <Anchor external type="unstyled" href="https://github.com/staab/coracle" class="flex items-center gap-2">
        <img alt="Coracle Logo" src="/images/favicon.png" class="w-8" />
        <h1 class="staatliches text-3xl">Coracle</h1>
      </Anchor>
      {#if $mostRecentAlert > $lastCheckedAlerts || hasNewMessages}
      <div class="w-2 h-2 rounded bg-accent absolute top-4 left-12 lg:hidden" />
      {/if}
    </div>

    {#if $modal}
    <Modal onEscape={closeModal}>
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
        class="fixed top-0 left-0 right-0 z-10"
        transition:fly={{y: -50, duration: 300}}
      >
        <div
          class="rounded bg-accent shadow-xl mx-24 sm:mx-32 mt-2 p-3 text-white text-center border border-dark"
        >
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
