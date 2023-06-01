<script lang="ts">
  import cx from "classnames"
  import {displayPerson} from "src/util/nostr"
  import {installPrompt} from "src/partials/state"
  import user from "src/agent/user"
  import pool from "src/agent/pool"
  import {routes, menuIsOpen} from "src/app/state"
  import {newNotifications, newDirectMessages, newChatMessages} from "src/app/state"
  import {slowConnections} from "src/app/state"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"

  const {profile, canPublish} = user

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
  class="fixed top-0 bottom-0 left-0 z-20 mt-16 w-56 overflow-hidden border-r border-gray-6 bg-gray-7 pt-4
         pb-20 text-gray-2 shadow-xl transition-all lg:mt-0 lg:ml-0"
  class:-ml-56={!$menuIsOpen}>
  {#if $profile.pubkey}
    <li>
      <a href={routes.person($profile.pubkey)} class="flex items-center gap-2 px-4 py-2 pb-6">
        <PersonCircle size={6} person={$profile} />
        <span class="text-lg font-bold">{displayPerson($profile)}</span>
      </a>
    </li>
    <li class="relative cursor-pointer">
      <a
        class="block px-4 py-2 transition-all hover:bg-accent hover:text-white"
        href="/notifications">
        <i class="fa fa-bell mr-2" /> Notifications
        {#if $newNotifications}
          <div class="absolute top-3 left-6 h-2 w-2 rounded bg-accent" />
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
      "cursor-pointer": $canPublish,
      "pointer-events-none opacity-75": !$canPublish,
    })}>
    <a class="block px-4 py-2 transition-all hover:bg-accent hover:text-white" href="/messages">
      <i class="fa fa-envelope mr-2" /> Messages
      {#if $newDirectMessages}
        <div class="absolute top-2 left-7 h-2 w-2 rounded bg-accent" />
      {/if}
    </a>
  </li>
  <li
    class={cx("relative", {
      "cursor-pointer": $canPublish,
      "pointer-events-none opacity-75": !$canPublish,
    })}>
    <a class="block px-4 py-2 transition-all hover:bg-accent hover:text-white" href="/chat">
      <i class="fa fa-comment mr-2" /> Chat
      {#if $newChatMessages}
        <div class="absolute top-2 left-7 h-2 w-2 rounded bg-accent" />
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
          <div class="absolute top-2 left-8 h-2 w-2 rounded bg-accent" />
        {/if}
      </a>
    </li>
  {/if}
  {#if $profile.pubkey}
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
