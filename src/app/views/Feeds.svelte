<script lang="ts">
  import cx from "classnames"
  import {Tags, noteKinds} from "src/util/nostr"
  import {modal, theme} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import type {DynamicFilter} from "src/engine"
  import {session, canSign, follows, lists, userLists} from "src/engine"

  const showLists = () => modal.push({type: "list/list"})

  const showLogin = () => modal.push({type: "login/intro"})

  const loadListFeed = naddr => {
    const list = lists.key(naddr).get()
    const authors = Tags.wrap(list.tags).pubkeys()
    const topics = Tags.wrap(list.tags).topics()
    const urls = Tags.wrap(list.tags).urls()

    if (urls.length > 0) {
      relays = urls
    }

    feedFilter = {kinds: noteKinds, authors: "global"} as DynamicFilter

    if (authors.length > 0) {
      feedFilter = {...feedFilter, authors}
    }

    if (topics.length > 0) {
      feedFilter = {...feedFilter, "#t": topics}
    }

    key = Math.random()
  }

  let relays = []
  let key = Math.random()
  let feedFilter = {
    kinds: noteKinds,
    authors: $follows.size > 0 ? "follows" : "network",
  } as DynamicFilter

  document.title = "Feeds"
</script>

<Content>
  {#if !$session}
    <Content size="lg" class="text-center">
      <p class="text-xl">Don't have an account?</p>
      <p>
        Click <Anchor class="underline" on:click={showLogin}>here</Anchor> to join the nostr network.
      </p>
    </Content>
  {/if}
  {#key key}
    <Feed filter={feedFilter} {relays}>
      <div slot="controls">
        {#if $canSign}
          {#if $userLists.length > 0}
            <Popover placement="bottom" opts={{hideOnClick: true}} theme="transparent">
              <i slot="trigger" class="fa fa-ellipsis-v cursor-pointer p-2" />
              <div
                slot="tooltip"
                class="flex flex-col items-start overflow-hidden rounded border border-solid border-gray-8 bg-black">
                {#each $userLists as list (list.naddr)}
                  <button
                    class={cx("w-full px-3 py-2 text-left transition-colors", {
                      "hover:bg-gray-7": $theme === "dark",
                      "hover:bg-gray-1": $theme === "light",
                    })}
                    on:click={() => loadListFeed(list.naddr)}>
                    <i class="fa fa-scroll fa-sm mr-1" />
                    {list.name}
                  </button>
                {/each}
                <button
                  on:click={showLists}
                  class={cx("w-full px-3 py-2 text-left transition-colors", {
                    "hover:bg-gray-7": $theme === "dark",
                    "hover:bg-gray-1": $theme === "light",
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
</Content>
