<script lang="ts">
  import {theme, installPrompt} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import NavItem from "src/partials/NavItem.svelte"
  import {hasNewNip04Messages, hasNewNotifications, canSign, canUseGiftWrap} from "src/engine"
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
  <NavItem href="/notes">
    <i class="fa fa-rss mr-2" /> Feed
  </NavItem>
  <NavItem href="/explore">
    <i class="fa fa-compass mr-2" /> Explore
  </NavItem>
  <NavItem href="/notifications">
    <i class="fa fa-bell mr-2" /> Notifications
    {#if $hasNewNotifications}
      <div
        class="absolute left-6 top-3 h-2 w-2 rounded border border-solid border-white bg-accent" />
    {/if}
  </NavItem>
  <NavItem disabled={!$canSign} href="/conversations">
    <i class="fa fa-envelope mr-2" /> Messages
    {#if $hasNewNip04Messages}
      <div
        class="absolute left-7 top-2 h-2 w-2 rounded border border-solid border-white bg-accent" />
    {/if}
  </NavItem>
  <NavItem disabled={!$canUseGiftWrap} href="/groups">
    <i class="fa fa-circle-nodes mr-2" /> Groups
  </NavItem>
  <NavItem href="/apps">
    <i class="fa fa-box mr-2" /> Apps
  </NavItem>
  <li class="mx-3 my-4 h-px bg-gray-6" />
  <NavItem on:click={toggleTheme}>
    <i class="fa fa-lightbulb mr-2" /> Theme
  </NavItem>
  {#if $installPrompt}
    <NavItem on:click={install}>
      <i class="fa fa-rocket mr-2" /> Install
    </NavItem>
  {/if}
  <NavItem href="/about">
    <i class="fa fa-info-circle mr-2" /> About
  </NavItem>
  <NavItem external href="https://github.com/coracle-social/coracle/issues/new">
    <i class="fa fa-message mr-2" /> Feedback
  </NavItem>
  <li class="absolute bottom-0 flex w-full justify-center gap-2 p-2 text-sm text-gray-5">
    <Anchor external theme="anchor" href="/public/terms.html">Terms</Anchor>
    &bull;
    <Anchor external theme="anchor" href="/public/privacy.html">Privacy</Anchor>
  </li>
</ul>
