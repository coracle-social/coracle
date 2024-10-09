<script lang="ts">
  import {onMount} from "svelte"
  import Masonry from "svelte-bricks"
  import {relaySearch} from "@welshman/app"
  import {createScroller} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import PageHeader from "@lib/components/PageHeader.svelte"
  import RelayName from "@app/components/RelayName.svelte"
  import RelayDescription from "@app/components/RelayDescription.svelte"
  import {makeSpacePath} from "@app/routes"
  import {userMembership, discoverRelays, getMembershipUrls} from "@app/state"

  let term = ""
  let limit = 20
  let element: Element

  $: relays = $relaySearch.searchOptions(term).slice(0, limit)

  onMount(() => {
    const sub = discoverRelays()
    const scroller = createScroller({
      element: element.closest(".max-h-screen")!,
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
  <PageHeader>
    <div slot="title">Discover Spaces</div>
    <div slot="info">Find communities all across the nostr network</div>
  </PageHeader>
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
      class="flex flex-col gap-2 card2 text-center bg-alt shadow-xl transition-all hover:shadow-2xl hover:brightness-[1.1]">
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
      {#if getMembershipUrls($userMembership).includes(relay.url)}
        <div class="flex justify-center">
          <div class="relative">
            <div
              class="tooltip absolute -top-[88px] left-5 h-5 w-5 rounded-full bg-primary"
              data-tip="You are already a member of this space.">
              <Icon icon="check-circle" class="scale-110" />
            </div>
          </div>
        </div>
      {/if}
      <div>
        <h2 class="text-center text-xl">
          <RelayName url={relay.url} />
        </h2>
        <p class="opacity-75 text-sm">{relay.url}</p>
      </div>
      <RelayDescription url={relay.url} />
    </a>
  </Masonry>
</div>
