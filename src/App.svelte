<script>
  import "@fortawesome/fontawesome-free/css/fontawesome.css"
  import "@fortawesome/fontawesome-free/css/solid.css"

  import {onMount} from "svelte"
  import {writable} from "svelte/store"
  import {fly} from "svelte/transition"
  import {Router, Route, links, navigate} from "svelte-routing"
  import {store as toast} from "src/state/toast"
  import {user} from 'src/state/user'
  import Feed from "src/routes/Feed.svelte"
  import Login from "src/routes/Login.svelte"
  import Profile from "src/routes/Profile.svelte"
  import RelayList from "src/routes/RelayList.svelte"
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
    document.querySelector("html").addEventListener("click", e => {
      if (e.target !== menuIcon) {
        menuIsOpen.set(false)
      }
    })
  })

  // Give the animation a moment to finish
  const logout = () => {
    setTimeout(() => {
      user.set(null)
      navigate("/login")
    }, 200)
  }
</script>

<Router {url}>
  <div use:links class="h-full">
    <div class="pt-16 text-white h-full">
      <Route path="/" component={Feed} />
      <Route path="/notes" component={Feed} />
      <Route path="/notes/new" component={NoteCreate} />
      <Route path="/chat" component={Chat} />
      <Route path="/chat/new" component={ChatEdit} />
      <Route path="/chat/:room" component={ChatRoom} />
      <Route path="/chat/:room/edit" component={ChatEdit} />
      <Route path="/user/:pubkey" component={UserDetail} />
      <Route path="/settings/relays" component={RelayList} />
      <Route path="/settings/profile" component={Profile} />
      <Route path="/login" component={Login} />
    </div>

    <ul
      class="py-20 w-56 bg-dark fixed top-0 bottom-0 left-0 transition-all shadow-xl
             border-r border-medium text-white overflow-hidden"
      class:-ml-56={!$menuIsOpen}
    >
      {#if $user}
      <li class="flex gap-2 px-4 py-2 pb-8 items-center">
        <div
          class="overflow-hidden w-6 h-6 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
          style="background-image: url({$user.picture})" />
        <span class="text-lg font-bold">{$user.name}</span>
      </li>
      {/if}
      <li class="cursor-pointer">
        <a class="block px-4 py-2 hover:bg-accent transition-all" href="/">
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
        <a class="block px-4 py-2 hover:bg-accent transition-all" href="/user/{$user.pubkey}">
          <i class="fa-solid fa-user-astronaut mr-2" /> Profile
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
