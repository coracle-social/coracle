<script lang="ts">
  import cx from "classnames"
  import type {DynamicFilter} from "src/util/types"
  import {indexBy, objOf} from "ramda"
  import {Tags} from "src/util/nostr"
  import {modal, theme} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import user from "src/agent/user"

  const {lists} = user

  let relays = null
  let filter = {kinds: [1, 1985], authors: "follows"} as DynamicFilter
  let key = Math.random()

  $: listsByName = indexBy(l => Tags.from(l).getMeta("d"), $lists)

  const showLists = () => {
    modal.push({type: "list/list"})
  }

  const loadListFeed = name => {
    const list = $lists.find(l => Tags.from(l).getMeta("d") === name)
    const authors = Tags.from(list).type("p").values().all()
    const topics = Tags.from(list).type("t").values().all()
    const urls = Tags.from(list).type("r").values().all()

    if (urls.length > 0) {
      relays = urls.map(objOf("url"))
    }

    filter = {kinds: [1, 1985], authors: "global"} as DynamicFilter

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

<Content>
  {#if !user.getProfile()}
    <Content size="lg" class="text-center">
      <p class="text-xl">Don't have an account?</p>
      <p>
        Click <Anchor href="/login">here</Anchor> to join the nostr network.
      </p>
    </Content>
  {/if}
  {#key key}
    <Feed {filter} {relays}>
      <div slot="controls">
        {#if $lists.length > 0}
          <Popover placement="bottom" opts={{hideOnClick: true}} theme="transparent">
            <i slot="trigger" class="fa fa-ellipsis-v cursor-pointer p-2" />
            <div
              slot="tooltip"
              class="flex flex-col items-start overflow-hidden rounded border border-solid border-gray-8 bg-black">
              {#each $lists as e (e.id)}
                {@const meta = Tags.from(e).asMeta()}
                <button
                  class={cx("w-full py-2 px-3 text-left transition-colors", {
                    "hover:bg-gray-7": $theme === "dark",
                    "hover:bg-gray-1": $theme === "light",
                  })}
                  on:click={() => loadListFeed(meta.d)}>
                  <i class="fa fa-scroll fa-sm mr-1" />
                  {meta.d}
                </button>
              {/each}
              <button
                on:click={showLists}
                class={cx("w-full py-2 px-3 text-left transition-colors", {
                  "hover:bg-gray-7": $theme === "dark",
                  "hover:bg-gray-1": $theme === "light",
                })}>
                <i class="fa fa-cog fa-sm mr-1" /> Customize
              </button>
            </div>
          </Popover>
        {:else}
          <i class="fa fa-ellipsis-v cursor-pointer p-1" on:click={showLists} />
        {/if}
      </div>
    </Feed>
  {/key}
</Content>
