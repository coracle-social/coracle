<script lang="ts">
  import {getProps} from "src/util/router"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import SearchResults from "src/app/shared/SearchResults.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {menuIsOpen, searchTerm} from "src/app/state"
  import {router} from "src/app/router"
  import {env, pubkey, hasNewNotifications, hasNewMessages} from "src/engine"

  let innerWidth = 0
  let searchInput

  const {page} = router

  const openMenu = () => menuIsOpen.set(true)

  const openSearch = () => router.at("/search").open()

  const onSearchBlur = () => setTimeout(() => searchTerm.set(null), 100)

  const onSearchKeydown = e => {
    if (e.key === "Escape") {
      searchTerm.set(null)
    }
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

    if ($env.FORCE_GROUP) {
      params.group = $env.FORCE_GROUP
    }

    router.at("notes/create").qp(params).open()
  }
</script>

<svelte:window bind:innerWidth />

<!-- top nav -->
{#if innerWidth >= 1024}
  <div
    class="fixed left-0 right-0 top-0 z-nav flex h-16 items-center justify-end gap-8 bg-dark-d px-4">
    <div class="relative">
      <div class="flex">
        <Input
          class="h-7 !rounded border-mid !bg-dark !px-2 py-px text-warm outline-none"
          on:blur={onSearchBlur}
          on:keydown={onSearchKeydown}
          bind:element={searchInput}
          bind:value={$searchTerm} />
        <Anchor button class="z-feature -ml-2">Search</Anchor>
      </div>
      {#if $searchTerm}
        <div
          class="absolute right-0 top-10 max-h-[70vh] w-96 overflow-auto rounded bg-cocoa shadow-2xl">
          <SearchResults term={$searchTerm}>
            <div slot="result" let:result class="px-4 py-2 transition-colors hover:bg-dark">
              {#if result.type === "topic"}
                #{result.topic.name}
              {:else if result.type === "profile"}
                <PersonBadge pubkey={result.id} />
              {/if}
            </div>
          </SearchResults>
        </div>
      {/if}
    </div>
    <Anchor button accent on:click={createNote}>Post +</Anchor>
  </div>
{/if}

<!-- bottom nav -->
{#if innerWidth < 1024}
  <div
    class="fixed bottom-0 left-0 right-0 z-nav flex items-center justify-between border-t border-solid border-mid bg-dark px-4 py-2">
    <div
      class="h-10 w-10 cursor-pointer rounded-full border-2 border-solid border-warm p-1 pl-3 pt-2 text-accent"
      on:click={openSearch}>
      <i class="fa fa-search scale-150" />
    </div>
    {#if $pubkey}
      <Anchor button accent on:click={createNote}>Post +</Anchor>
    {:else}
      <Anchor modal button accent href="/login/intro">Log In</Anchor>
    {/if}
    <div class="flex cursor-pointer items-center" on:click={openMenu}>
      <i class="fa fa-bars fa-2xl" />
      {#if $pubkey}
        <PersonCircle class="-ml-2 h-12 w-12 border-4 !border-dark" pubkey={$pubkey} />
        {#if $hasNewNotifications || $hasNewMessages}
          <div class="absolute right-4 top-4 h-2 w-2 rounded bg-accent" />
        {/if}
      {/if}
    </div>
  </div>
{/if}
