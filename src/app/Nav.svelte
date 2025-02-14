<script lang="ts">
  import { i18n } from './stores/i18nStore'
  import {pubkey, signer} from "@welshman/app"
  import {slide, fly} from "src/util/transition"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import SearchResults from "src/app/shared/SearchResults.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {menuIsOpen, searchTerm} from "src/app/state"
  import {router} from "src/app/util/router"
  import {hasNewMessages, hasNewNotifications} from "src/engine"
  import OpenTranslationsButton from "src/app/i18n/OpenTranslationsButton.svelte"

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
  <div
    class="fixed left-0 right-0 top-0 z-nav flex h-16 items-center justify-end gap-8 bg-neutral-900 pl-4 pr-8">
    <div class="relative">
      <div class="flex">
        <OpenTranslationsButton />
        <Input
          dark
          class="border-tinted-700 !bg-neutral-800 py-px outline-none"
          on:blur={onSearchBlur}
          on:keydown={onSearchKeydown}
          bind:element={searchInput}
          bind:value={$searchTerm} />
        <Anchor button class="z-feature -ml-2 border-none !bg-tinted-700 !text-tinted-200"
          > {$i18n.t('page.home.search', { default: 'Search' })} 
        </Anchor>
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
              Loading more options...
            </div>
          {/if}
        </div>
      {/if}
    </div>
    {#if $signer}
      <Anchor button accent on:click={createNote}>Post +</Anchor>
    {:else if !$pubkey}
      <Anchor modal button accent href="/login">{$i18n.t('page.home.login', { default: 'S\'authentifier' })} </Anchor>
    {/if}
  </div>
{/if}

<!-- bottom nav -->
{#if innerWidth < 1024}
  <div
    class="fixed bottom-0 left-0 right-0 z-nav flex items-center justify-between rounded-t-xl border-neutral-600 bg-tinted-800 px-4 py-2 dark:bg-black">
    <div class="w-1/3">
      <div
        class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-solid border-neutral-600 text-accent dark:border-tinted-600 dark:bg-tinted-800"
        on:click={openSearch}>
        <i class="fa fa-search -mb-1 -mr-1 text-xl" />
      </div>
    </div>
    <div>
      {#if $signer}
        <Anchor button accent on:click={createNote}>Post +</Anchor>
      {:else if !$pubkey}
        <Anchor modal button accent href="/login">Log In</Anchor>
      {/if}
    </div>
    <div class="flex w-1/3 justify-end">
      <div class="flex cursor-pointer items-center" on:click={openMenu}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 448 512"
          fill="currentColor"
          class="pt-1 text-neutral-600 dark:text-tinted-600"
          width="36"
          height="36">
          <path
            fill="currentColor"
            d="M0 88C0 74.7 10.7 64 24 64H424c13.3 0 24 10.7 24 24s-10.7 24-24 24H24C10.7 112 0 101.3 0 88zM0 248c0-13.3 10.7-24 24-24H424c13.3 0 24 10.7 24 24s-10.7 24-24 24H24c-13.3 0-24-10.7-24-24zM448 408c0 13.3-10.7 24-24 24H24c-13.3 0-24-10.7-24-24s10.7-24 24-24H424c13.3 0 24 10.7 24 24z" />
        </svg>
        {#if $signer}
          <PersonCircle
            class="-ml-4 h-11 w-11 border-4 border-white dark:border-black"
            pubkey={$pubkey} />
          {#if $hasNewNotifications || $hasNewMessages}
            <div class="absolute right-4 top-4 h-2 w-2 rounded bg-accent" />
          {/if}
        {/if}
      </div>
    </div>
  </div>
{/if}
