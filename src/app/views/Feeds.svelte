<script lang="ts">
  import cx from "classnames"
  import {Tags} from "@coracle.social/util"
  import {Scope, filterFeed, relayFeed} from "@coracle.social/feeds"
  import {noteKinds} from "src/util/nostr"
  import {theme} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {router} from "src/app/util/router"
  import {session, canSign, lists, userLists} from "src/engine"

  export let relays = []
  export let feed = filterFeed({kinds: noteKinds, scopes: [Scope.Follows]})

  if (relays.length > 0) {
    feed = relayFeed(relays, feed)
  }

  let key = Math.random()

  const showLists = () => router.at("lists").open()

  const showLogin = () => router.at("login").open()

  const loadListFeed = address => {
    const list = lists.key(address).get()
    const tags = Tags.wrap(list.tags)
    const authors = tags.values("p").valueOf()
    const topics = tags.topics().valueOf()
    const urls = tags.values("r").valueOf()

    if (authors.length > 0) {
      feed = filterFeed({kinds: noteKinds, authors})
    } else if (topics.length > 0) {
      feed = filterFeed({kinds: noteKinds, "#t": topics})
    } else {
      feed = filterFeed({kinds: noteKinds, scopes: [Scope.Follows]})
    }

    if (urls.length > 0) {
      feed = relayFeed(urls, feed)
    }

    key = Math.random()
  }

  document.title = "Feeds"
</script>

{#if !$session}
  <div class="py-16 text-center">
    <p class="text-xl">Don't have an account?</p>
    <p>
      Click <Anchor class="underline" on:click={showLogin}>here</Anchor> to join the nostr network.
    </p>
  </div>
{/if}

{#key key}
  <Feed skipCache includeReposts showGroup {feed}>
    <div slot="controls">
      {#if $canSign}
        {#if $userLists.length > 0}
          <Popover placement="bottom" opts={{hideOnClick: true}} theme="transparent">
            <i slot="trigger" class="fa fa-scroll cursor-pointer p-2" />
            <div
              slot="tooltip"
              class="flex flex-col items-start overflow-hidden rounded border border-solid border-neutral-800 bg-black">
              {#each $userLists as list (list.address)}
                <button
                  class={cx("w-full px-3 py-2 text-left transition-colors", {
                    "hover:bg-tinted-700": $theme === "dark",
                    "hover:bg-neutral-100": $theme === "light",
                  })}
                  on:click={() => loadListFeed(list.address)}>
                  <i class="fa fa-scroll fa-sm mr-1" />
                  {list.title}
                </button>
              {/each}
              <button
                on:click={showLists}
                class={cx("w-full px-3 py-2 text-left transition-colors", {
                  "hover:bg-tinted-700": $theme === "dark",
                  "hover:bg-neutral-100": $theme === "light",
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
