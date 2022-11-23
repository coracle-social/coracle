<script>
  import "@fortawesome/fontawesome-free/css/fontawesome.css"
  import "@fortawesome/fontawesome-free/css/solid.css"

  import {onMount} from "svelte"
  import {writable} from "svelte/store"
  import {fly} from "svelte/transition"
  import {Router, Route, links} from "svelte-routing"
  import {store as toast} from "src/state/toast"
  import Feed from "src/routes/Feed.svelte"
  import Login from "src/routes/Login.svelte"
  import Profile from "src/routes/Profile.svelte"
  import RelayList from "src/routes/RelayList.svelte"
  import RelayDetail from "src/routes/RelayDetail.svelte"
  import Explore from "src/routes/Explore.svelte"
  import Messages from "src/routes/Messages.svelte"

  const menuIsOpen = writable(false)
  const toggleMenu = () => menuIsOpen.update(x => !x)

  const searchIsOpen = writable(false)
  const toggleSearch = () => searchIsOpen.update(x => !x)

  let menuIcon

  export let url = ""

  onMount(() => {
    document.querySelector("body").addEventListener("click", e => {
      if (e.target !== menuIcon) {
        menuIsOpen.set(false)
      }
    })
  })
</script>

<Router {url}>
  <div use:links>
    <div class="py-20 p-4 text-white">
      <Route path="/" component={Feed} />
      <Route path="/login" component={Login} />
      <Route path="/profile" component={Profile} />
      <Route path="/relays" component={RelayList} />
      <Route path="/relays/:id" component={RelayDetail} />
      <Route path="/explore" component={Explore} />
      <Route path="/messages" component={Messages} />
    </div>

    <ul
      class="py-20 p-4 w-48 bg-dark fixed top-0 bottom-0 left-0 transition-all shadow-xl
             border-r border-light text-white"
      class:-ml-48={!$menuIsOpen}
    >
      <li class="cursor-pointer py-2">
        <a href="/profile">
          <i class="fa-solid fa-user-astronaut mr-2" /> Profile
        </a>
      </li>
      <li class="cursor-pointer py-2">
        <a href="/relays">
          <i class="fa-solid fa-server mr-2" /> Relays
        </a>
      </li>
    </ul>

    <div
      class="fixed top-0 bg-dark flex justify-between items-center text-white w-full p-4
                border-b border-light"
    >
      <i class="fa-solid fa-bars fa-2xl cursor-pointer" bind:this={menuIcon} on:click={toggleMenu} />
      <h1 class="staatliches text-3xl">Blazepoint</h1>
    </div>

    <div
      class="fixed bottom-0 bg-dark flex justify-between items-center text-white w-full
                border-t border-light px-8 p-6"
    >
      <a href="/"><i class="fa-solid fa-home fa-xl" /></a>
      <i class="cursor-pointer fa-solid fa-search fa-xl" on:click={toggleSearch} />
      <a href="/explore"><i class="fa-solid fa-compass fa-xl" /></a>
      <a href="/messages"><i class="fa-solid fa-envelope fa-xl" /></a>
    </div>

    {#if $toast}
      <div
        class="fixed bottom-0 left-0 right-0 pointer-events-none"
        transition:fly={{y: 50, duration: 300}}
      >
        <div
          class="rounded bg-accent shadow-xl mb-14 m-2 p-4 text-white text-center border border-dark"
        >
          {$toast.message}
        </div>
      </div>
    {/if}
  </div>
</Router>
