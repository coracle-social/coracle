<script>
  import "@fortawesome/fontawesome-free/css/fontawesome.css"
  import "@fortawesome/fontawesome-free/css/solid.css"

  import {pluck} from 'ramda'
  import {onMount} from "svelte"
  import {writable, get} from "svelte/store"
  import {fly, fade} from "svelte/transition"
  import {cubicInOut} from "svelte/easing"
  import {Router, Route, links, navigate} from "svelte-routing"
  import {globalHistory} from "svelte-routing/src/history"
  import {hasParent} from 'src/util/html'
  import {displayPerson, isLike} from 'src/util/nostr'
  import {timedelta, now} from 'src/util/misc'
  import {keys, user, pool, getRelays} from 'src/agent'
  import {modal, toast, settings, alerts} from "src/app"
  import {routes} from "src/app/ui"
  import Anchor from 'src/partials/Anchor.svelte'
  import Spinner from 'src/partials/Spinner.svelte'
  import Modal from 'src/partials/Modal.svelte'
  import SignUp from "src/views/SignUp.svelte"
  import PrivKeyLogin from "src/views/PrivKeyLogin.svelte"
  import PubKeyLogin from "src/views/PubKeyLogin.svelte"
  import NoteDetail from "src/views/NoteDetail.svelte"
  import PersonSettings from "src/views/PersonSettings.svelte"
  import NoteCreate from "src/views/NoteCreate.svelte"
  import NotFound from "src/routes/NotFound.svelte"
  import Search from "src/routes/Search.svelte"
  import Alerts from "src/routes/Alerts.svelte"
  import Notes from "src/routes/Notes.svelte"
  import Login from "src/routes/Login.svelte"
  import Logout from "src/routes/Logout.svelte"
  import Profile from "src/routes/Profile.svelte"
  import Settings from "src/routes/Settings.svelte"
  import Keys from "src/routes/Keys.svelte"
  import RelayList from "src/routes/RelayList.svelte"
  import AddRelay from "src/routes/AddRelay.svelte"
  import Person from "src/routes/Person.svelte"
  import Bech32Entity from "src/routes/Bech32Entity.svelte"

  export let url = ""

  const menuIsOpen = writable(false)
  const toggleMenu = () => menuIsOpen.update(x => !x)

  const searchIsOpen = writable(false)
  const toggleSearch = () => searchIsOpen.update(x => !x)

  const closeModal = () => {
    modal.set(null)
    menuIsOpen.set(false)
  }

  const {canSign} = keys
  const {lastCheckedAlerts, mostRecentAlert} = alerts

  let menuIcon
  let scrollY
  let suspendedSubs = []
  let slowConnections = []

  onMount(() => {
    if ($user) {
      alerts.load(getRelays(), $user.pubkey)
      alerts.listen(getRelays(), $user.pubkey)
    }

    const interval = setInterval(() => {
      // Only notify about relays the user is actually subscribed to
      const relayUrls = pluck('url', getRelays())

      // Prune connections we haven't used in a while
      pool.getConnections()
        .filter(conn => conn.lastRequest < Date.now() - 60_000)
        .forEach(conn => conn.disconnect())

      // Log stats for debugging purposes
      console.log(
        'Connection stats',
        pool.getConnections()
          .map(({url, stats: s}) => ({url, avgRequest: s.timer / s.count}))
      )

      // Alert the user to any heinously slow connections
      slowConnections = pool.getConnections()
        .filter(({url, stats: s}) => relayUrls.includes(url) && s.timer / s.count > 3000)
    }, 10_000)

    // Close menu on click outside
    document.querySelector("html").addEventListener("click", e => {
      if (e.target !== menuIcon) {
        menuIsOpen.set(false)
      }
    })

    const unsubModal = modal.subscribe($modal => {
      // Keep scroll position on body, but don't allow scrolling
      if ($modal) {
        // This is not idempotent, so don't duplicate it
        if (document.body.style.position !== 'fixed') {
          scrollY = window.scrollY

          document.body.style.top = `-${scrollY}px`
          document.body.style.position = `fixed`
        }
      } else {
        document.body.style = ''
        window.scrollTo(0, scrollY)
      }
    })

    return () => {
      clearInterval(interval)
      unsubModal()
    }
  })
</script>

<Router {url}>
  <div use:links class="h-full">
    <div class="pt-16 text-white h-full lg:ml-56">
      <Route path="/alerts" component={Alerts} />
      <Route path="/search/:activeTab" component={Search} />
      <Route path="/notes/:activeTab" component={Notes} />
      <Route path="/people/:npub/:activeTab" let:params>
        {#key params.npub}
        <Person {...params} />
        {/key}
      </Route>
      <Route path="/keys" component={Keys} />
      <Route path="/relays" component={RelayList} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/login" component={Login} />
      <Route path="/logout" component={Logout} />
      <Route path="/:entity" let:params>
        {#key params.entity}
        <Bech32Entity {...params} />
        {/key}
      </Route>
      <Route path="*" component={NotFound} />
    </div>

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
      <li class="cursor-pointer">
        <a class="block px-4 py-2 hover:bg-accent transition-all" href="/search/people">
          <i class="fa-solid fa-search mr-2" /> Search
        </a>
      </li>
      {/if}
      <li class="cursor-pointer">
        <a class="block px-4 py-2 hover:bg-accent transition-all" href="/notes/global">
          <i class="fa-solid fa-tag mr-2" /> Notes
        </a>
      </li>
      {#if $user}
      <li class="h-px mx-3 my-4 bg-medium" />
      <li class="cursor-pointer relative">
        <a class="block px-4 py-2 hover:bg-accent transition-all" href="/relays">
          <i class="fa-solid fa-server mr-2" /> Relays
          {#if slowConnections.length > 0}
          <div class="w-2 h-2 rounded bg-accent absolute top-2 left-8" />
          {/if}
        </a>
      </li>
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
    </ul>

    <div
      class="fixed top-0 bg-dark flex justify-between items-center text-white w-full p-4
                border-b border-medium z-10"
    >
      <div class="lg:hidden">
        <i class="fa-solid fa-bars fa-2xl cursor-pointer" bind:this={menuIcon} on:click={toggleMenu} />
      </div>
      <Anchor external type="unstyled" href="https://github.com/staab/coracle" class="flex items-center gap-2">
        <img src="/images/favicon.png" class="w-8" />
        <h1 class="staatliches text-3xl">Coracle</h1>
      </Anchor>
      {#if $mostRecentAlert > $lastCheckedAlerts || slowConnections.length > 0}
      <div class="w-2 h-2 rounded bg-accent absolute top-4 left-12 lg:hidden" />
      {/if}
    </div>

    {#if $canSign}
    <div class="fixed bottom-0 right-0 m-8">
      <a
        class="rounded-full bg-accent color-white w-16 h-16 flex justify-center
                items-center border border-dark shadow-2xl cursor-pointer"
        on:click={() => modal.set({form: 'note/create'})}>
        <span class="fa-sold fa-plus fa-2xl" />
      </a>
    </div>
    {/if}

    {#if $modal}
    <Modal onEscape={closeModal}>
      {#if $modal.note}
        {#key $modal.note.id}
        <NoteDetail {...$modal} />
        {/key}
      {:else if $modal.form === 'note/create'}
        <NoteCreate />
      {:else if $modal.form === 'relay'}
        <AddRelay />
      {:else if $modal.form === 'signUp'}
        <SignUp />
      {:else if $modal.form === 'privkeyLogin'}
        <PrivKeyLogin />
      {:else if $modal.form === 'pubkeyLogin'}
        <PubKeyLogin />
      {:else if $modal.form === 'person/settings'}
        <PersonSettings />
      {:else if $modal.message}
        <p class="text-white text-center py-12 pb-8">{$modal.message}</p>
        <Spinner />
      {/if}
    </Modal>
    {/if}

    {#if $toast}
      <div
        class="fixed top-0 left-0 right-0 pointer-events-none z-10"
        transition:fly={{y: -50, duration: 300}}
      >
        <div
          class="rounded bg-accent shadow-xl mx-24 sm:mx-32 mt-2 p-3 text-white text-center border border-dark"
        >
          {$toast.message}
        </div>
      </div>
    {/if}
  </div>
</Router>
