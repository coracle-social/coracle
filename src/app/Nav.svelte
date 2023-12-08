<script lang="ts">
  import {getProps} from "src/util/router"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {menuIsOpen, searchTerm, hasNewDMs} from "src/app/state"
  import {router} from "src/app/router"
  import {pubkey, hasNewNotifications} from "src/engine"

  let innerWidth = 0
  let searchInput

  const {page} = router

  const openMenu = () => menuIsOpen.set(true)

  const openSearch = () => searchTerm.set("")

  const createNote = () => {
    const params = {} as any
    const props = getProps($page) as any

    if ($page.path.startsWith("/people") && props.pubkey) {
      params.pubkey = props.pubkey
    }

    if ($page.path.startsWith("/groups") && props.address) {
      params.group = props.address
    }

    router.at("notes/create").qp(params).open()
  }
</script>

<svelte:window bind:innerWidth />

<!-- top nav -->
<div class="fixed top-0 left-0 right-0 flex justify-end items-center h-16 gap-8 bg-dark px-4 border-b border-solid border-mid">
  {#if innerWidth < 1024}
    <img alt="App Logo" src={import.meta.env.VITE_LOGO_URL || "/images/logo.png"} class="w-10" />
  {:else}
    <div class="flex">
      <Input
        class="h-7 !px-2 py-px !bg-dark border-mid text-warm !rounded outline-none"
        bind:this={searchInput}
        bind:value={$searchTerm} />
      <Anchor button class="-ml-2 z-10 text-dark">Search</Anchor>
    </div>
    <Anchor button accent on:click={createNote}>Post +</Anchor>
  {/if}
</div>

<!-- bottom nav -->
{#if innerWidth < 1024}
  <div
    class="fixed bottom-0 left-0 right-0 flex justify-between items-center bg-dark py-2 px-4 border-t border-solid border-mid">
    <div
      class="border-2 border-solid border-warm text-accent rounded-full w-10 h-10 pl-3 pt-2 p-1 cursor-pointer"
      on:click={openSearch}>
      <i class="fa fa-search scale-150" />
    </div>
    <Anchor button accent on:click={createNote}>Post +</Anchor>
    <div class="flex items-center cursor-pointer" on:click={openMenu}>
      <i class="fa fa-bars fa-2xl" />
      {#if $pubkey}
        <div class="-ml-2 border-4 border-solid border-dark rounded-full">
          <PersonCircle class="h-10 w-10" pubkey={$pubkey} />
          {#if $hasNewNotifications || $hasNewDMs}
            <div class="absolute right-4 top-4 h-2 w-2 rounded bg-accent" />
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}
