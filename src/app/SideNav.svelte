<script lang="ts">
  import cx from "classnames"
  import {theme, installPrompt} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import {
    hasNewNip28Messages,
    hasNewNip04Messages,
    hasNewNip24Messages,
    hasNewNotifications,
    canUseGiftWrap,
    canSign,
  } from "src/engine"
  import {menuIsOpen} from "src/app/state"

  const toggleTheme = () => theme.update(t => (t === "dark" ? "light" : "dark"))

  const install = () => {
    $installPrompt.prompt()

    $installPrompt.userChoice.then(result => {
      installPrompt.set(null)
    })
  }
</script>

<ul
  class="fixed bottom-0 left-0 top-0 z-20 mt-16 w-48 overflow-hidden border-r border-gray-6 bg-gray-7 pb-20
         pt-4 text-gray-2 shadow-xl transition-all lg:ml-0"
  class:-ml-48={!$menuIsOpen}>
  <li class="cursor-pointer">
    <a class="block px-4 py-2 transition-all hover:bg-accent hover:text-white" href="/notes">
      <i class="fa fa-rss mr-2" /> Feed
    </a>
  </li>
  <li class="cursor-pointer">
    <a class="block px-4 py-2 transition-all hover:bg-accent hover:text-white" href="/explore">
      <i class="fa fa-compass mr-2" /> Explore
    </a>
  </li>
  <li
    class={cx("relative", {
      "cursor-pointer": $canSign,
      "pointer-events-none opacity-75": !$canSign,
    })}>
    <a
      class="block px-4 py-2 transition-all hover:bg-accent hover:text-white"
      href="/notifications">
      <i class="fa fa-bell mr-2" /> Notifications
      {#if $hasNewNotifications}
        <div
          class="absolute left-6 top-3 h-2 w-2 rounded border border-solid border-white bg-accent" />
      {/if}
    </a>
  </li>
  {#if $canUseGiftWrap}
    <li
      class={cx("relative", {
        "cursor-pointer": $canSign,
        "pointer-events-none opacity-75": !$canSign,
      })}>
      <a class="block px-4 py-2 transition-all hover:bg-accent hover:text-white" href="/channels">
        <i class="fa fa-envelope mr-2" /> Messages
        {#if $hasNewNip24Messages || $hasNewNip04Messages}
          <div
            class="absolute left-7 top-2 h-2 w-2 rounded border border-solid border-white bg-accent" />
        {/if}
      </a>
    </li>
  {:else}
    <li
      class={cx("relative", {
        "cursor-pointer": $canSign,
        "pointer-events-none opacity-75": !$canSign,
      })}>
      <a
        class="block px-4 py-2 transition-all hover:bg-accent hover:text-white"
        href="/conversations">
        <i class="fa fa-envelope mr-2" /> Messages
        {#if $hasNewNip04Messages}
          <div
            class="absolute left-7 top-2 h-2 w-2 rounded border border-solid border-white bg-accent" />
        {/if}
      </a>
    </li>
  {/if}
  <li class="relative">
    <a class="block px-4 py-2 transition-all hover:bg-accent hover:text-white" href="/chat">
      <i class="fa fa-comment mr-2" /> Chat
      {#if $hasNewNip28Messages}
        <div
          class="absolute left-7 top-2 h-2 w-2 rounded border border-solid border-white bg-accent" />
      {/if}
    </a>
  </li>
  <li class="cursor-pointer">
    <a class="block px-4 py-2 transition-all hover:bg-accent hover:text-white" href="/apps">
      <i class="fa fa-box mr-2" /> Apps
    </a>
  </li>
  <li class="mx-3 my-4 h-px bg-gray-6" />
  <li
    class="block cursor-pointer px-4 py-2 transition-all hover:bg-accent hover:text-white"
    on:click={toggleTheme}>
    <i class="fa fa-lightbulb mr-2" /> Theme
  </li>
  {#if $installPrompt}
    <li
      class="cursor-pointer px-4 py-2 transition-all hover:bg-accent hover:text-white"
      on:click={install}>
      <i class="fa fa-rocket mr-2" /> Install
    </li>
  {/if}
  <li class="cursor-pointer">
    <a class="block px-4 py-2 transition-all hover:bg-accent hover:text-white" href="/about">
      <i class="fa fa-info-circle mr-2" /> About
    </a>
  </li>
  <li class="cursor-pointer">
    <a
      class="block px-4 py-2 transition-all hover:bg-accent hover:text-white"
      href="https://github.com/coracle-social/coracle/issues/new">
      <i class="fa fa-message mr-2" /> Feedback
    </a>
  </li>
  <li class="absolute bottom-0 flex w-full justify-center gap-2 p-2 text-sm text-gray-5">
    <Anchor external theme="anchor" href="/public/terms.html">Terms</Anchor>
    &bull;
    <Anchor external theme="anchor" href="/public/privacy.html">Privacy</Anchor>
  </li>
</ul>
