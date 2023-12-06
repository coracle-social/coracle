<script lang="ts">
  import {onMount} from "svelte"
  import {appName} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import SearchAndScan from "src/app/SearchAndScan.svelte"
  import TopNavMenu from "src/app/TopNavMenu.svelte"
  import {menuIsOpen, toggleMenu, hasNewDMs} from "src/app/state"
  import {router} from "src/app/router"
  import {session, hasNewNotifications} from "src/engine"

  const logoUrl = import.meta.env.VITE_LOGO_URL || "/images/logo.png"

  const showLogin = () => router.at("login/intro").open()

  onMount(() => {
    document.querySelector("html").addEventListener("click", e => {
      if (!(e.target as any).closest(".app-logo")) {
        menuIsOpen.set(false)
      }
    })
  })
</script>

<div class="flex justify-between items-center">
  <img alt="App Logo" src={logoUrl} class="w-10" />
</div>

<div
  class="cy-top-nav fixed top-0 z-10 flex h-16 w-full items-center justify-between
            border-b border-mid bg-cocoa px-2 text-lightest">
  <div>
    <div class="app-logo flex cursor-pointer items-center gap-2" on:click={toggleMenu}>
      <img alt="App Logo" src={logoUrl} class="w-10" />
      <!--
      <img
        alt="Happy Harvest!"
        src="/images/pumpkin.png"
        class="w-10"
        title="png image from pngtree.com" /> -->
      <h1 class="staatliches pt-1 text-3xl">{appName}</h1>
      {#if $hasNewNotifications || $hasNewDMs}
        <div
          class="absolute left-8 top-4 h-2 w-2 rounded border border-solid border-white bg-accent" />
      {/if}
    </div>
  </div>
  {#if $session}
    <TopNavMenu />
  {:else}
    <Anchor button accent on:click={showLogin}>Log In</Anchor>
  {/if}
</div>

<div class="fixed bottom-0 left-0 right-0 flex justify-between items-center bg-dark py-2 px-4">
  <SearchAndScan />
  <Anchor button accent>Post +</Anchor>
  <div class="flex items-center" on:click={toggleMenu}>
    <i class="fa fa-bars text-warm fa-2xl" />
    {#if $session}
      <div class="-ml-2 border-4 border-solid border-dark rounded-full">
        <TopNavMenu />
      </div>
    {/if}
  </div>
</div>
