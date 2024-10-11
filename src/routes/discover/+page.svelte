<script lang="ts">
  import {onMount} from "svelte"
  import Masonry from "svelte-bricks"
  import {relaySearch} from "@welshman/app"
  import {createScroller} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import PageHeader from "@lib/components/PageHeader.svelte"
  import RelayName from "@app/components/RelayName.svelte"
  import RelayDescription from "@app/components/RelayDescription.svelte"
  import SpaceCheck from "@app/components/SpaceCheck.svelte"
  import {userMembership, discoverRelays, getMembershipUrls} from "@app/state"
  import {pushModal} from '@app/modal'

  const openSpace = (url: string) => pushModal(SpaceCheck, {url})

  let term = ""
  let limit = 20
  let element: Element

  $: relays = $relaySearch.searchOptions(term).slice(0, limit)

  onMount(() => {
    const sub = discoverRelays()
    const scroller = createScroller({
      element: element.closest(".overflow-auto")!,
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
    <Button
      class="card2 bg-alt text-left flex flex-col gap-2 shadow-xl transition-all hover:shadow-2xl hover:brightness-[1.1]"
      on:click={() => openSpace(relay.url)}>
      <div class="flex gap-4">
        <div class="avatar">
          <div class="center !flex h-12 w-12 min-w-12 rounded-full border-2 border-solid border-base-300 bg-base-300">
            {#if relay.profile?.icon}
              <img alt="" src={relay.profile.icon} />
            {:else}
              <Icon icon="ghost" size={5} />
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
          <h2 class="text-xl">
            <RelayName url={relay.url} />
          </h2>
          <p class="text-sm opacity-75">{relay.url}</p>
        </div>
      </div>
      <RelayDescription url={relay.url} class="ml-16" />
    </Button>
  </Masonry>
</div>
