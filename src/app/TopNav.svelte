<script lang="ts">
  import {onMount} from "svelte"
  import {appName} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import {alerts, chat} from "src/app/system"
  import {menuIsOpen} from "src/app/state"

  const {hasNewNotfications} = alerts
  const {hasNewChatMessages, hasNewDirectMessages} = chat
  const logoUrl = import.meta.env.VITE_LOGO_URL || "/images/logo.png"
  const toggleMenu = () => menuIsOpen.update(x => !x)

  onMount(() => {
    document.querySelector("html").addEventListener("click", e => {
      if (!(e.target as any).matches(".fa-bars")) {
        menuIsOpen.set(false)
      }
    })
  })
</script>

<div
  class="fixed top-0 z-10 flex h-16 w-full items-center justify-between border-b
            border-gray-6 bg-gray-7 p-4 text-gray-2">
  <div class="fa fa-bars fa-2xl -m-6 cursor-pointer p-6 lg:hidden" on:click={toggleMenu} />
  <div class="flex items-center gap-4">
    <Anchor
      external
      type="unstyled"
      href="https://info.coracle.social"
      class="flex items-center gap-2">
      <img alt="Coracle Logo" src={logoUrl} class="w-8" />
      <h1 class="staatliches text-3xl">{appName}</h1>
    </Anchor>
  </div>
  {#if $hasNewNotfications || $hasNewChatMessages || $hasNewDirectMessages}
    <div class="absolute left-12 top-4 h-2 w-2 rounded bg-accent lg:hidden" />
  {/if}
</div>
