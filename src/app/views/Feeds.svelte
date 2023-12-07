<script lang="ts">
  import cx from "classnames"
  import {Tags} from "paravel"
  import {noteKinds} from "src/util/nostr"
  import {theme} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {router} from "src/app/router"
  import type {DynamicFilter} from "src/engine"
  import {session, canSign, follows, lists, userLists} from "src/engine"

  export let relays = []
  export let filter: DynamicFilter = {
    kinds: noteKinds,
    authors: $follows.size > 0 ? "follows" : "network",
  }

  let key = Math.random()

  const showLists = () => router.at("lists").open()

  const showLogin = () => router.at("login/intro").open()

  const loadListFeed = naddr => {
    const list = lists.key(naddr).get()
    const authors = Tags.from(list).pubkeys().all()
    const topics = Tags.from(list).topics().all()
    const urls = Tags.from(list).urls().all()

    if (urls.length > 0) {
      relays = urls
    }

    filter = {kinds: noteKinds, authors: "global"} as DynamicFilter

    if (authors.length > 0) {
      filter = {...filter, authors}
    }

    if (topics.length > 0) {
      filter = {...filter, "#t": topics}
    }

    key = Math.random()
  }

  document.title = "Feeds"
</script>

{#if !$session}
  <div class="text-center">
    <p class="text-xl">Don't have an account?</p>
    <p>
      Click <Anchor class="underline" on:click={showLogin}>here</Anchor> to join the nostr network.
    </p>
  </div>
{/if}

{#key key}
  <Feed showGroup {filter} {relays}>
    <div slot="controls">
      {#if $canSign}
        {#if $userLists.length > 0}
          <Popover placement="bottom" opts={{hideOnClick: true}} theme="transparent">
            <i slot="trigger" class="fa fa-scroll cursor-pointer p-2" />
            <div
              slot="tooltip"
              class="flex flex-col items-start overflow-hidden rounded border border-solid border-dark bg-black">
              {#each $userLists as list (list.naddr)}
                <button
                  class={cx("w-full px-3 py-2 text-left transition-colors", {
                    "hover:bg-cocoa": $theme === "dark",
                    "hover:bg-lightest": $theme === "light",
                  })}
                  on:click={() => loadListFeed(list.naddr)}>
                  <i class="fa fa-scroll fa-sm mr-1" />
                  {list.name}
                </button>
              {/each}
              <button
                on:click={showLists}
                class={cx("w-full px-3 py-2 text-left transition-colors", {
                  "hover:bg-cocoa": $theme === "dark",
                  "hover:bg-lightest": $theme === "light",
                })}>
                <i class="fa fa-cog fa-sm mr-1" /> Customize
              </button>
            </div>
          </Popover>
        {:else}
          <i class="fa fa-ellipsis-v cursor-pointer p-2" on:click={showLists} />
        {/if}
      {/if}
    </div>
  </Feed>
{/key}
