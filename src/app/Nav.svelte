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

  const {page, modal} = router

  const openMenu = () => menuIsOpen.set(true)

  const openSearch = () => {
    router.at("/search").open()

    // Hack to keep focus
    const interval = setInterval(() => {
      if (!searchInput || $modal?.path !== "/search") {
        clearInterval(interval)
      } else if (document.activeElement !== searchInput) {
        searchInput.focus()
      }
    }, 300)
  }

  const createNote = () => {
    if (!$pubkey) {
      return router.at("/login/intro").open()
    }

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
{#if innerWidth >= 1024}
  <div class="fixed left-0 right-0 top-0 flex h-16 items-center justify-end gap-8 bg-dark-d px-4">
    <div class="flex" on:click={openSearch}>
      <Input
        class="h-7 !rounded border-mid !bg-dark !px-2 py-px text-warm outline-none"
        bind:element={searchInput}
        bind:value={$searchTerm} />
      <Anchor button class="z-feature -ml-2">Search</Anchor>
    </div>
    <Anchor button accent on:click={createNote}>Post +</Anchor>
  </div>
{/if}

<!-- bottom nav -->
{#if innerWidth < 1024}
  <div
    class="fixed bottom-0 left-0 right-0 flex items-center justify-between border-t border-solid border-mid bg-dark px-4 py-2">
    <div
      class="h-10 w-10 cursor-pointer rounded-full border-2 border-solid border-warm p-1 pl-3 pt-2 text-accent"
      on:click={openSearch}>
      <i class="fa fa-search scale-150" />
    </div>
    <Anchor button accent on:click={createNote}>Post +</Anchor>
    <div class="flex cursor-pointer items-center" on:click={openMenu}>
      <i class="fa fa-bars fa-2xl" />
      {#if $pubkey}
        <PersonCircle class="-ml-2 h-12 w-12 border-4 !border-dark" pubkey={$pubkey} />
        {#if $hasNewNotifications || $hasNewDMs}
          <div class="absolute right-4 top-4 h-2 w-2 rounded bg-accent" />
        {/if}
      {/if}
    </div>
  </div>
{/if}
