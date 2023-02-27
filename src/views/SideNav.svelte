<script lang="ts">
  import {displayPerson} from 'src/util/nostr'
  import user from 'src/agent/user'
  import {menuIsOpen, routes} from 'src/app/ui'
  import {newAlerts, newDirectMessages, newChatMessages} from 'src/app/alerts'
  import {slowConnections} from 'src/app/connection'

  const {profile} = user
</script>

<ul
  class="mt-16 pt-4 pb-20 lg:mt-4 w-56 bg-dark fixed top-0 bottom-0 left-0 transition-all shadow-xl
         border-r border-medium text-white overflow-hidden z-20 lg:ml-0"
  class:-ml-56={!$menuIsOpen}
>
  {#if $profile}
  <li>
    <a href={routes.person($profile.pubkey)} class="flex gap-2 px-4 py-2 pb-6 items-center">
      <div
        class="overflow-hidden w-6 h-6 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
        style="background-image: url({$profile.kind0?.picture})" />
      <span class="text-lg font-bold">{displayPerson($profile)}</span>
    </a>
  </li>
  <li class="cursor-pointer relative">
    <a class="block px-4 py-2 hover:bg-accent transition-all" href="/alerts">
      <i class="fa-solid fa-bell mr-2" /> Alerts
      {#if $newAlerts}
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
    <a class="block px-4 py-2 hover:bg-accent transition-all" href="/notes/follows">
      <i class="fa-solid fa-tag mr-2" /> Notes
    </a>
  </li>
  {#if $profile}
  <li class="cursor-pointer relative">
    <a class="block px-4 py-2 hover:bg-accent transition-all" href="/messages">
      <i class="fa-solid fa-envelope mr-2" /> Messages
      {#if $newDirectMessages}
      <div class="w-2 h-2 rounded bg-accent absolute top-2 left-7" />
      {/if}
    </a>
  </li>
  <li class="cursor-pointer relative">
    <a class="block px-4 py-2 hover:bg-accent transition-all" href="/chat">
      <i class="fa-solid fa-comment mr-2" /> Chat
      {#if $newChatMessages}
      <div class="w-2 h-2 rounded bg-accent absolute top-2 left-7" />
      {/if}
    </a>
  </li>
  {/if}
  <li class="h-px mx-3 my-4 bg-medium" />
  <li class="cursor-pointer relative">
    <a class="block px-4 py-2 hover:bg-accent transition-all" href="/relays">
      <i class="fa-solid fa-server mr-2" /> Relays
      {#if $slowConnections.length > 0}
      <div class="w-2 h-2 rounded bg-accent absolute top-2 left-8" />
      {/if}
    </a>
  </li>
  {#if $profile}
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

