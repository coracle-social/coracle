<script lang="ts">
  import {onMount} from "svelte"
  import {derived} from 'svelte/store'
  import Masonry from "svelte-bricks"
  import {addToMapKey, dec, gt, inc} from "@welshman/lib"
  import type {Relay} from "@welshman/app"
  import {relays, createSearch} from "@welshman/app"
  import {createScroller} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import PageHeader from "@lib/components/PageHeader.svelte"
  import RelayName from "@app/components/RelayName.svelte"
  import RelayDescription from "@app/components/RelayDescription.svelte"
  import SpaceCheck from "@app/components/SpaceCheck.svelte"
  import ProfileCircles from "@app/components/ProfileCircles.svelte"
  import {userMembership, memberships, membershipByPubkey, getMembershipUrls, getDefaultPubkeys} from "@app/state"
  import {discoverRelays} from "@app/commands"
  import {pushModal} from "@app/modal"

  const wotGraph = derived(
    membershipByPubkey,
    $m => {
      const scores = new Map<string, Set<string>>()

      for (const pubkey of getDefaultPubkeys()) {
        for (const url of getMembershipUrls($m.get(pubkey))) {
          addToMapKey(scores, url, pubkey)
        }
      }

      return scores
    }
  )

  const openSpace = (url: string) => pushModal(SpaceCheck, {url})

  let term = ""
  let limit = 20
  let element: Element

  $: relaySearch = createSearch($relays, {
    getValue: (relay: Relay) => relay.url,
    sortFn: ({score, item}) => {
      if (score && score > 0.1) return -score!

      const wotScore = $wotGraph.get(item.url)?.size || 0

      return score ? dec(score) * wotScore : -wotScore
    },
    fuseOptions: {
      keys: ["url", "name", {name: "description", weight: 0.3}],
      shouldSort: false,
    },
  })

  $: results = relaySearch.searchOptions(term).slice(0, limit)

  onMount(() => {
    discoverRelays($memberships)

    const scroller = createScroller({
      element: element.closest(".overflow-auto")!,
      onScroll: () => {
        limit += 20
      },
    })

    return () => {
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
    items={results}
    minColWidth={300}
    maxColWidth={800}
    gap={16}
    idKey="url"
    let:item={relay}>
    <Button
      class="card2 bg-alt flex flex-col gap-2 text-left shadow-xl transition-all hover:shadow-2xl hover:brightness-[1.1]"
      on:click={() => openSpace(relay.url)}>
      <div class="flex gap-4 relative">
        <div class="relative">
          <div class="avatar relative">
            <div
              class="center !flex h-12 w-12 min-w-12 rounded-full border-2 border-solid border-base-300 bg-base-300">
              {#if relay.profile?.icon}
                <img alt="" src={relay.profile.icon} />
              {:else}
                <Icon icon="ghost" size={5} />
              {/if}
            </div>
          </div>
          {#if getMembershipUrls($userMembership).includes(relay.url)}
            <div
              class="absolute -right-1 -top-1 tooltip h-5 w-5 rounded-full bg-primary"
              data-tip="You are already a member of this space.">
              <Icon icon="check-circle" class="scale-110" />
            </div>
          {/if}
        </div>
        <div>
          <h2 class="text-xl ellipsize whitespace-nowrap">
            <RelayName url={relay.url} />
          </h2>
          <p class="text-sm opacity-75">{relay.url}</p>
        </div>
      </div>
      <RelayDescription url={relay.url} />
      {#if gt($wotGraph.get(relay.url)?.size, 0)}
        <div class="row-2 card2 card2-sm bg-alt">
          Members:
          <ProfileCircles pubkeys={Array.from($wotGraph.get(relay.url) || [])} />
        </div>
      {/if}
    </Button>
  </Masonry>
</div>
