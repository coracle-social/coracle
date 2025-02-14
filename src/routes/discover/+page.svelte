<script lang="ts">
  import {onMount} from "svelte"
  import {addToMapKey, dec, gt} from "@welshman/lib"
  import type {Relay} from "@welshman/app"
  import {relays, createSearch, loadRelay, loadRelaySelections} from "@welshman/app"
  import {createScroller} from "@lib/html"
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Page from "@lib/components/Page.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import PageHeader from "@lib/components/PageHeader.svelte"
  import RelayName from "@app/components/RelayName.svelte"
  import RelayDescription from "@app/components/RelayDescription.svelte"
  import SpaceCheck from "@app/components/SpaceCheck.svelte"
  import ProfileCircles from "@app/components/ProfileCircles.svelte"
  import {
    membershipByPubkey,
    getMembershipUrls,
    loadMembership,
    userRoomsByUrl,
    getDefaultPubkeys,
  } from "@app/state"
  import {pushModal} from "@app/modal"

  const discoverRelays = () =>
    Promise.all(
      getDefaultPubkeys().map(async pubkey => {
        await loadRelaySelections(pubkey)

        const membership = await loadMembership(pubkey)
        const urls = getMembershipUrls(membership)

        await Promise.all(urls.map(url => loadRelay(url)))
      }),
    )

  const wotGraph = $derived.by(() => {
    const scores = new Map<string, Set<string>>()

    for (const pubkey of getDefaultPubkeys()) {
      for (const url of getMembershipUrls($membershipByPubkey.get(pubkey))) {
        addToMapKey(scores, url, pubkey)
      }
    }

    return scores
  })

  const relaySearch = $derived(
    createSearch(
      $relays.filter(r => wotGraph.has(r.url)),
      {
        getValue: (relay: Relay) => relay.url,
        sortFn: ({score, item}) => {
          if (score && score > 0.1) return -score!

          const wotScore = wotGraph.get(item.url)?.size || 0

          return score ? dec(score) * wotScore : -wotScore
        },
        fuseOptions: {
          keys: ["url", "name", {name: "description", weight: 0.3}],
          shouldSort: false,
        },
      },
    ),
  )

  const openSpace = (url: string) => pushModal(SpaceCheck, {url})

  let term = $state("")
  let limit = $state(20)
  let element: Element

  onMount(() => {
    const scroller = createScroller({
      element,
      onScroll: () => {
        limit += 20
      },
    })

    return () => {
      scroller.stop()
    }
  })
</script>

<Page>
  <div class="content column gap-4" bind:this={element}>
    <PageHeader>
      {#snippet title()}
        Discover Spaces
      {/snippet}
      {#snippet info()}
        Find communities all across the nostr network
      {/snippet}
    </PageHeader>
    <label class="input input-bordered flex w-full items-center gap-2">
      <Icon icon="magnifer" />
      <input bind:value={term} class="grow" type="text" placeholder="Search for spaces..." />
    </label>
    {#each relaySearch.searchOptions(term).slice(0, limit) as relay (relay.url)}
      <Button
        class="card2 bg-alt col-4 text-left shadow-xl transition-all hover:shadow-2xl hover:brightness-[1.1]"
        onclick={() => openSpace(relay.url)}>
        <div class="col-2">
          <div class="relative flex gap-4">
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
              {#if $userRoomsByUrl.has(relay.url)}
                <div
                  class="tooltip absolute -right-1 -top-1 h-5 w-5 rounded-full bg-primary"
                  data-tip="You are already a member of this space.">
                  <Icon icon="check-circle" class="scale-110" />
                </div>
              {/if}
            </div>
            <div>
              <h2 class="ellipsize whitespace-nowrap text-xl">
                <RelayName url={relay.url} />
              </h2>
              <p class="text-sm opacity-75">{relay.url}</p>
            </div>
          </div>
          <RelayDescription url={relay.url} />
        </div>
        {#if gt(wotGraph.get(relay.url)?.size, 0)}
          <div class="row-2 card2 card2-sm bg-alt">
            Members:
            <ProfileCircles pubkeys={Array.from(wotGraph.get(relay.url) || [])} />
          </div>
        {/if}
      </Button>
    {/each}
    {#await discoverRelays()}
      <div class="flex justify-center py-20" out:fly>
        <Spinner loading>Looking for spaces...</Spinner>
      </div>
    {/await}
  </div>
</Page>
