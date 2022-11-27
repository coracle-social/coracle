<script>
  import "@fortawesome/fontawesome-free/css/fontawesome.css"
  import "@fortawesome/fontawesome-free/css/solid.css"

  import {onMount} from "svelte"
  import {writable} from "svelte/store"
  import {fly, fade} from "svelte/transition"
  import {cubicInOut} from "svelte/easing"
  import {Router, Route, links, navigate} from "svelte-routing"
  import {globalHistory} from "svelte-routing/src/history"
  import {hasParent} from 'src/util/html'
  import {store as toast} from "src/state/toast"
  import {modal, logout} from "src/state/app"
  import {user} from 'src/state/user'
  import NoteDetail from "src/partials/NoteDetail.svelte"
  import NotFound from "src/routes/NotFound.svelte"
  import Notes from "src/routes/Notes.svelte"
  import Login from "src/routes/Login.svelte"
  import Profile from "src/routes/Profile.svelte"
  import Keys from "src/routes/Keys.svelte"
  import RelayList from "src/routes/RelayList.svelte"
  import AddRelay from "src/routes/AddRelay.svelte"
  import UserDetail from "src/routes/UserDetail.svelte"
  import NoteCreate from "src/routes/NoteCreate.svelte"
  import Chat from "src/routes/Chat.svelte"
  import ChatRoom from "src/routes/ChatRoom.svelte"
  import ChatEdit from "src/routes/ChatEdit.svelte"

  const menuIsOpen = writable(false)
  const toggleMenu = () => menuIsOpen.update(x => !x)

  const searchIsOpen = writable(false)
  const toggleSearch = () => searchIsOpen.update(x => !x)

  let menuIcon

  export let url = ""

  onMount(() => {
    // Close menu on click outside
    document.querySelector("html").addEventListener("click", e => {
      if (e.target !== menuIcon) {
        menuIsOpen.set(false)
      }
    })

    globalHistory.listen(() => {
      modal.set(null)
    })
  })
</script>

<svelte:body on:keydown={e => e.key === 'Escape' && modal.set(null)} />

<Router {url}>
  <div use:links class="h-full">
    <div class="pt-16 text-white h-full" class:overflow-hidden={$modal}>
      <Route path="/notes" component={Notes} />
      <Route path="/notes/new" component={NoteCreate} />
      <Route path="/chat" component={Chat} />
      <Route path="/chat/new" component={ChatEdit} />
      <Route path="/chat/:room" let:params>
        {#key params.room}
        <ChatRoom room={params.room} />
        {/key}
      </Route>
      <Route path="/chat/:room/edit" component={ChatEdit} />
      <Route path="/users/:pubkey" component={UserDetail} />
      <Route path="/settings/keys" component={Keys} />
      <Route path="/settings/relays" component={RelayList} />
      <Route path="/settings/profile" component={Profile} />
      <Route path="/login" component={Login} />
      <Route path="*" component={NotFound} />
    </div>

    <ul
      class="py-20 w-56 bg-dark fixed top-0 bottom-0 left-0 transition-all shadow-xl
             border-r border-medium text-white overflow-hidden"
      class:-ml-56={!$menuIsOpen}
    >
      {#if $user}
      <li>
        <a href={`/users/${$user.pubkey}`} class="flex gap-2 px-4 py-2 pb-6 items-center">
          <div
            class="overflow-hidden w-6 h-6 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
            style="background-image: url({$user.picture})" />
          <span class="text-lg font-bold">{$user.name}</span>
        </a>
      </li>
      {/if}
      <li class="cursor-pointer">
        <a class="block px-4 py-2 hover:bg-accent transition-all" href="/notes">
          <i class="fa-solid fa-tag mr-2" /> Notes
        </a>
      </li>
      <li class="cursor-pointer">
        <a class="block px-4 py-2 hover:bg-accent transition-all" href="/chat">
          <i class="fa-solid fa-message mr-2" /> Chat
        </a>
      </li>
      <li class="h-px mx-3 my-4 bg-medium" />
      {#if $user}
      <li class="cursor-pointer">
        <a class="block px-4 py-2 hover:bg-accent transition-all" href="/settings/keys">
          <i class="fa-solid fa-key mr-2" /> Keys
        </a>
      </li>
      <li class="cursor-pointer">
        <a class="block px-4 py-2 hover:bg-accent transition-all" href="/settings/relays">
          <i class="fa-solid fa-server mr-2" /> Relays
        </a>
      </li>
      <li class="cursor-pointer">
        <a class="block px-4 py-2 hover:bg-accent transition-all" on:click={logout}>
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
                border-b border-medium"
    >
      <i class="fa-solid fa-bars fa-2xl cursor-pointer" bind:this={menuIcon} on:click={toggleMenu} />
      <h1 class="staatliches text-3xl">Coracle</h1>
    </div>

    {#if $modal}
    <div class="fixed inset-0">
      <div
        class="absolute inset-0 opacity-75 bg-black cursor-pointer"
        transition:fade
        on:click={e => modal.set(null)} />
      <div class="absolute inset-0 mt-20 sm:mt-32 modal-content" transition:fly={{y: 1000, opacity: 1}}>
        <dialog open class="bg-dark border-t border-solid border-medium h-full w-full overflow-auto">
          {#if $modal.note}
            {#key $modal.note.id}
            <NoteDetail note={$modal.note} />
            {/key}
          {:else if $modal.form === 'relay'}
            <AddRelay />
          {/if}
        </dialog>
      </div>
    </div>
    {/if}

    {#if $toast}
      <div
        class="fixed bottom-0 left-0 right-0 pointer-events-none"
        transition:fly={{y: 50, duration: 300}}
      >
        <div
          class="rounded bg-accent shadow-xl m-4 p-4 text-white text-center border border-dark"
        >
          {$toast.message}
        </div>
      </div>
    {/if}
  </div>
</Router>
