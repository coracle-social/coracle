<script lang="ts">
  import {_} from "svelte-i18n"
  import {pubkey, signer} from "@welshman/app"
  import {slide, fly} from "src/util/transition"
  import Input from "src/partials/Input.svelte"
  import Button from "src/partials/Button.svelte"
  import Link from "src/partials/Link.svelte"
  import SearchResults from "src/app/shared/SearchResults.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {menuIsOpen, searchTerm} from "src/app/state"
  import {router} from "src/app/util/router"
  import {hasNewMessages, hasNewNotifications} from "src/engine"

  let innerWidth = 0
  let searching = false
  let searchInput

  const {page} = router

  const openMenu = () => menuIsOpen.set(true)

  const openSearch = () => router.at("/search").open()

  const onSearchBlur = () => searchTerm.set(null)

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
    const props = router.getProps($page) as any

    if ($page.path.startsWith("/people") && props.pubkey) {
      params.pubkey = props.pubkey
    }

    router.at("notes/create").qp(params).open()
  }
</script>

<svelte:window bind:innerWidth />

<!-- top nav -->
{#if innerWidth >= 1024}
  <div class="top-sai left-sai right-sai fixed z-nav">
    <div class="flex h-16 items-center justify-end gap-8 bg-neutral-900 pl-4 pr-8">
      <div class="relative">
        <div class="flex">
          <Input
            dark
            class="border-tinted-700 !bg-neutral-800 py-px outline-none"
            on:blur={onSearchBlur}
            on:keydown={onSearchKeydown}
            bind:element={searchInput}
            bind:value={$searchTerm} />
          <Button class="btn z-feature -ml-2 border-none !bg-tinted-700 !text-tinted-200"
            >{$_("nav.search")}</Button>
        </div>
        {#if $searchTerm}
          <div
            on:mousedown|preventDefault
            out:fly|local={{y: 20, duration: 200}}
            class="absolute right-0 top-10 w-96 rounded opacity-100 shadow-2xl transition-colors">
            <div class="max-h-[70vh] overflow-auto rounded bg-tinted-700">
              <SearchResults bind:searching term={searchTerm}>
                <div
                  slot="result"
                  let:result
                  class="cursor-pointer px-4 py-2 transition-colors hover:bg-neutral-800">
                  {#if result.type === "topic"}
                    #{result.topic.name}
                  {:else if result.type === "profile"}
                    <PersonBadge inert pubkey={result.id} />
                  {/if}
                </div>
              </SearchResults>
            </div>
            {#if searching}
              <div
                transition:slide|local={{duration: 200, delay: 100}}
                class="flex justify-center gap-2 bg-neutral-900 px-4 py-2 text-neutral-200">
                <div>
                  <i class="fa fa-circle-notch fa-spin" />
                </div>
                {$_("nav.loadingMore")}
              </div>
            {/if}
          </div>
        {/if}
      </div>
      {#if $signer}
        <Button class="btn btn-accent" on:click={createNote}>{$_("nav.post")}</Button>
      {:else if !$pubkey}
        <Link modal class="btn btn-accent" href="/login">{$_("nav.logIn")}</Link>
      {/if}
    </div>
  </div>
{/if}

<!-- top nav (mobile) -->
{#if innerWidth < 1024}
  <div
    class="px-sai fixed left-0 right-0 top-0 z-nav border-b border-neutral-600 bg-tinted-800 dark:bg-black">
    <div class="flex items-center justify-between px-4 py-2">
      <div class="flex items-center gap-2">
        <div
          class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-accent"
          on:click={openSearch}>
          <i class="fa fa-search text-xl" />
        </div>
        {#if $signer}
          <Button class="btn btn-accent btn-sm" on:click={createNote}>{$_("nav.post")}</Button>
        {:else if !$pubkey}
          <Link modal class="btn btn-accent btn-sm" href="/login">{$_("nav.logIn")}</Link>
        {/if}
      </div>
      <div class="relative flex items-center">
        <div class="flex cursor-pointer items-center" on:click={openMenu}>
          {#if $signer}
            <PersonCircle
              class="h-9 w-9 border-2 border-white dark:border-black"
              pubkey={$pubkey} />
            {#if $hasNewNotifications || $hasNewMessages}
              <div class="absolute right-0 top-0 h-2 w-2 rounded bg-accent" />
            {/if}
          {/if}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
            fill="currentColor"
            class="ml-1 text-neutral-600 dark:text-tinted-600"
            width="28"
            height="28">
            <path
              fill="currentColor"
              d="M0 88C0 74.7 10.7 64 24 64H424c13.3 0 24 10.7 24 24s-10.7 24-24 24H24C10.7 112 0 101.3 0 88zM0 248c0-13.3 10.7-24 24-24H424c13.3 0 24 10.7 24 24s-10.7 24-24 24H24c-13.3 0-24-10.7-24-24zM448 408c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24s10.7-24 24-24H424c13.3 0 24 10.7 24 24z" />
          </svg>
        </div>
      </div>
    </div>
  </div>
{/if}
