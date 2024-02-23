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
      return router.at("/login").open()
    }

    const params = {} as any
    const props = getProps($page) as any

    if ($page.path.startsWith("/people") && props.pubkey) {
      params.pubkey = props.pubkey
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
    class="fixed left-0 right-0 top-0 z-nav flex h-16 items-center justify-end gap-8 bg-neutral-900 pl-4 pr-8">
    <div class="relative">
      <div class="flex">
        <Input
          class="h-7 !rounded !border-tinted-700 !bg-neutral-800 !px-2 py-px text-tinted-200 outline-none"
          on:blur={onSearchBlur}
          on:keydown={onSearchKeydown}
          bind:element={searchInput}
          bind:value={$searchTerm} />
        <Anchor button class="z-feature -ml-2 border-none !bg-tinted-700 !text-tinted-200">Search</Anchor>
      </div>
      {#if $searchTerm}
        <div
          class="absolute right-0 top-10 max-h-[70vh] w-96 overflow-auto rounded bg-tinted-700 shadow-2xl">
          <SearchResults showLoading term={searchTerm}>
            <div slot="result" let:result class="px-4 py-2 transition-colors hover:bg-neutral-800">
              {#if result.type === "topic"}
                #{result.topic.name}
              {:else if result.type === "profile"}
                <PersonBadge inert pubkey={result.id} class="cursor-pointer" />
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
    class="fixed bottom-0 left-0 right-0 z-nav flex items-center justify-between border-neutral-600 bg-tinted-800 dark:bg-black px-4 py-2">
    <div class="w-1/3">
      <div
        class="h-8 w-8 cursor-pointer rounded-full border-[3px] border-solid border-neutral-600 dark:border-tinted-600 text-accent flex justify-center items-center"
        on:click={openSearch}>
        <i class="fa fa-search" />
      </div>
    </div>
    <div>
      {#if $pubkey}
        <Anchor button accent on:click={createNote}>Post +</Anchor>
      {:else}
        <Anchor modal button accent href="/login">Log In</Anchor>
      {/if}
    </div>
    <div class="flex w-1/3 justify-end">
      <div class="flex cursor-pointer items-center" on:click={openMenu}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor" class="text-neutral-600 dark:text-tinted-600 pt-1" width="36" height="36">
          <path fill="currentColor" d="M0 88C0 74.7 10.7 64 24 64H424c13.3 0 24 10.7 24 24s-10.7 24-24 24H24C10.7 112 0 101.3 0 88zM0 248c0-13.3 10.7-24 24-24H424c13.3 0 24 10.7 24 24s-10.7 24-24 24H24c-13.3 0-24-10.7-24-24zM448 408c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24s10.7-24 24-24H424c13.3 0 24 10.7 24 24z"/>
        </svg>
        {#if $pubkey}
          <PersonCircle class="-ml-4 h-10 w-10 border-4 !border-neutral-800" pubkey={$pubkey} />
          {#if $hasNewNotifications || $hasNewMessages}
            <div class="absolute right-4 top-4 h-2 w-2 rounded bg-accent" />
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
