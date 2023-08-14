<script lang="ts">
  import cx from "classnames"
  import type {DynamicFilter} from "src/engine/types"
  import {Tags, noteKinds} from "src/util/nostr"
  import {modal, theme} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {Keys, user, default as engine} from "src/app/engine"

  const lists = engine.Content.lists.derived(() => user.getLists())

  const showLists = () => modal.push({type: "list/list"})

  const showLogin = () => modal.push({type: "login/intro"})

  const loadListFeed = naddr => {
    const list = engine.Content.lists.key(naddr).get()
    const authors = Tags.wrap(list.tags).pubkeys()
    const topics = Tags.wrap(list.tags).topics()
    const urls = Tags.wrap(list.tags).urls()

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

  let relays = []
  let key = Math.random()
  let filter = {
    kinds: noteKinds,
    authors: user.getFollows().length > 0 ? "follows" : "network",
  } as DynamicFilter

  document.title = "Feeds"
</script>

<Content>
  {#if !Keys.pubkey.get()}
    <Content size="lg" class="text-center">
      <p class="text-xl">Don't have an account?</p>
      <p>
        Click <Anchor class="underline" on:click={showLogin}>here</Anchor> to join the nostr network.
      </p>
    </Content>
  {/if}
  {#key key}
    <Feed {filter} {relays}>
      <div slot="controls">
        {#if Keys.canSign.get()}
          {#if $lists.length > 0}
            <Popover placement="bottom" opts={{hideOnClick: true}} theme="transparent">
              <i slot="trigger" class="fa fa-ellipsis-v cursor-pointer p-2" />
              <div
                slot="tooltip"
                class="flex flex-col items-start overflow-hidden rounded border border-solid border-gray-8 bg-black">
                {#each $lists as list (list.naddr)}
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
