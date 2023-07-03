<script lang="ts">
  import cx from "classnames"
  import {theme, installPrompt} from "src/partials/state"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {keys, directory, alerts} from "src/system"
  import {watch} from "src/agent/db"
  import pool from "src/agent/pool"
  import {routes, slowConnections, menuIsOpen} from "src/app/state"

  const {canSign, pubkey} = keys
  const {hasNewNotfications, hasNewChatMessages, hasNewDirectMessages} = alerts
  const profile = watch(directory.profiles, () => ($pubkey ? directory.getProfile($pubkey) : null))

  const toggleTheme = () => theme.update(t => (t === "dark" ? "light" : "dark"))

  const install = () => {
    $installPrompt.prompt()

    $installPrompt.userChoice.then(result => {
      if (result.outcome === "accepted") {
        console.log("User accepted the A2HS prompt")
      } else {
        console.log("User dismissed the A2HS prompt")
      }

      installPrompt.set(null)
    })
  }
</script>

<ul
  class="fixed bottom-0 left-0 top-0 z-20 mt-16 w-56 overflow-hidden border-r border-gray-6 bg-gray-7 pb-20
         pt-4 text-gray-2 shadow-xl transition-all lg:ml-0 lg:mt-0"
  class:-ml-56={!$menuIsOpen}>
  {#if $profile}
    <li>
      <a href={routes.person($pubkey)} class="flex items-center gap-2 px-4 py-2 pb-6">
        <PersonCircle size={6} pubkey={$pubkey} />
        <span class="text-lg font-bold">{directory.displayProfile($profile)}</span>
      </a>
    </li>
    <li class="relative cursor-pointer">
      <a
        class="block px-4 py-2 transition-all hover:bg-accent hover:text-white"
        href="/notifications">
        <i class="fa fa-bell mr-2" /> Notifications
        {#if $hasNewNotfications}
          <div class="absolute left-6 top-3 h-2 w-2 rounded bg-accent" />
        {/if}
      </a>
    </li>
  {/if}
  <li class="cursor-pointer">
    <a class="block px-4 py-2 transition-all hover:bg-accent hover:text-white" href="/notes">
      <i class="fa fa-rss mr-2" /> Feed
    </a>
  </li>
  <li class="cursor-pointer">
    <a class="block px-4 py-2 transition-all hover:bg-accent hover:text-white" href="/search">
      <i class="fa fa-search mr-2" /> Search
    </a>
  </li>
  <li
    class={cx("relative", {
      "cursor-pointer": $canSign,
      "pointer-events-none opacity-75": !$canSign,
    })}>
    <a class="block px-4 py-2 transition-all hover:bg-accent hover:text-white" href="/messages">
      <i class="fa fa-envelope mr-2" /> Messages
      {#if $hasNewDirectMessages}
        <div class="absolute left-7 top-2 h-2 w-2 rounded bg-accent" />
      {/if}
    </a>
  </li>
  <li class="relative">
    <a class="block px-4 py-2 transition-all hover:bg-accent hover:text-white" href="/chat">
      <i class="fa fa-comment mr-2" /> Chat
      {#if $hasNewChatMessages}
        <div class="absolute left-7 top-2 h-2 w-2 rounded bg-accent" />
      {/if}
    </a>
  </li>
  <li class="cursor-pointer">
    <a class="block px-4 py-2 transition-all hover:bg-accent hover:text-white" href="/apps">
      <i class="fa fa-motorcycle mr-2" /> Apps
    </a>
  </li>
  <li class="mx-3 my-4 h-px bg-gray-6" />
  {#if pool.forceUrls.length === 0}
    <li class="relative cursor-pointer">
      <a class="block px-4 py-2 transition-all hover:bg-accent hover:text-white" href="/relays">
        <i class="fa fa-server mr-2" /> Relays
        {#if $slowConnections.length > 0}
          <div class="absolute left-8 top-2 h-2 w-2 rounded bg-accent" />
        {/if}
      </a>
    </li>
  {/if}
  {#if $profile}
    <li class="cursor-pointer">
      <a class="block px-4 py-2 transition-all hover:bg-accent hover:text-white" href="/keys">
        <i class="fa fa-key mr-2" /> Keys
      </a>
    </li>
    <li class="cursor-pointer">
      <a class="block px-4 py-2 transition-all hover:bg-accent hover:text-white" href="/settings">
        <i class="fa fa-gear mr-2" /> Settings
      </a>
    </li>
  {/if}
  <li
    class="block cursor-pointer px-4 py-2 transition-all hover:bg-accent hover:text-white"
    on:click={toggleTheme}>
    <i class="fa fa-lightbulb mr-2" /> Theme
  </li>
  {#if $profile}
    <li class="cursor-pointer">
      <a class="block px-4 py-2 transition-all hover:bg-accent hover:text-white" href="/logout">
        <i class="fa fa-right-from-bracket mr-2" /> Logout
      </a>
    </li>
  {:else}
    <li class="cursor-pointer">
      <a class="block px-4 py-2 transition-all hover:bg-accent hover:text-white" href="/login">
        <i class="fa fa-right-to-bracket mr-2" /> Login
      </a>
    </li>
  {/if}
  {#if $installPrompt}
    <li
      class="cursor-pointer px-4 py-2 transition-all hover:bg-accent hover:text-white"
      on:click={install}>
      <i class="fa fa-rocket mr-2" /> Install
    </li>
  {/if}
</ul>
