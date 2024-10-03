<script lang="ts">
  import {onMount} from "svelte"
  import Masonry from "svelte-bricks"
  import {displayRelayUrl} from "@welshman/util"
  import {relaySearch} from "@welshman/app"
  import {createScroller} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import {makeSpacePath} from "@app/routes"
  import {userMembership, discoverRelays} from "@app/state"

  let term = ""
  let limit = 20
  let element: Element

  $: relays = $relaySearch.searchOptions(term).slice(0, limit)

  onMount(() => {
    const sub = discoverRelays()
    const scroller = createScroller({
      element: element.closest('.max-h-screen')!,
      onScroll: () => {
        limit += 20
      },
    })

    return () => {
      sub.close()
      scroller.stop()
    }
  })
</script>

<div class="content column gap-4" bind:this={element}>
  <h1 class="superheading mt-20">Discover Spaces</h1>
  <p class="text-center">Find communities all across the nostr network</p>
  <label class="input input-bordered flex w-full items-center gap-2">
    <Icon icon="magnifer" />
    <input bind:value={term} class="grow" type="text" placeholder="Search for spaces..." />
  </label>
  <Masonry
    animate={false}
    items={relays}
    minColWidth={250}
    maxColWidth={800}
    gap={16}
    idKey="url"
    let:item={relay}>
    <a
      href={makeSpacePath(relay.url)}
      class="card2 bg-alt shadow-xl transition-all hover:shadow-2xl hover:brightness-[1.1]">
      <div class="center avatar mt-8">
        <div
          class="center relative !flex w-20 rounded-full border-2 border-solid border-base-300 bg-base-300">
          {#if relay.profile?.icon}
            <img alt="" src={relay.profile.icon} />
          {:else}
            <Icon icon="ghost" size={7} />
          {/if}
        </div>
      </div>
      {#if $userMembership?.roomsByUrl.has(relay.url)}
        <div class="center absolute flex w-full">
          <div
            class="tooltip relative left-8 top-[38px] h-5 w-5 rounded-full bg-primary"
            data-tip="You are already a member of this space.">
            <Icon icon="check-circle" class="scale-110" />
          </div>
        </div>
      {/if}
      <h2 class="text-center">{displayRelayUrl(relay.url)}</h2>
      {#if relay.profile?.description}
        <p class="py-4 text-center text-sm">{relay.profile.description}</p>
      {/if}
    </a>
  </Masonry>
</div>
