<script lang="ts">
  import {onMount} from "svelte"
  import {batch, seconds} from "hurdak"
  import {pluck, filter, uniq, path} from "ramda"
  import {now, createScroller} from "src/util/misc"
  import {Tags} from "src/util/nostr"
  import {modal} from "src/partials/state"
  import Input from "src/partials/Input.svelte"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import ChatListItem from "src/app/views/ChatListItem.svelte"
  import type {Event, Filter} from "src/engine"
  import {
    session,
    canSign,
    follows,
    stateKey,
    searchNip28Channels,
    load,
    getPubkeyHints,
    searchableRelays,
    sortChannels,
    nip28ChannelsWithMeta,
    loadPubkeys,
    getPubkeysWithDefaults,
  } from "src/engine"

  let q = ""
  let results = []
  let limit = 5

  const loadMore = async () => {
    limit += 5
  }

  const scroller = createScroller(loadMore)

  const channels = nip28ChannelsWithMeta.derived(sortChannels)

  const joined = channels.derived(filter(path(["nip28", "joined"])))

  const searchChannels = q => {
    if (q.length > 3) {
      load({
        relays: $searchableRelays,
        filters: [{kinds: [40, 41], search: q}],
      })
    }
  }

  $: searchChannels(q)
  $: results = $searchNip28Channels(q).slice(0, limit)

  document.title = "Chat"

  onMount(() => {
    const relays = getPubkeyHints.limit(3).getHints($stateKey, "read")
    const authors = getPubkeysWithDefaults($follows)
    const since = now() - seconds(1, "day")
    const filters = [
      {kinds: [40, 41], authors, limit: 100},
      {kinds: [42], since, authors, limit: 100},
    ] as Filter[]

    if ($session) {
      filters.push({kinds: [40, 41], authors: [$session.pubkey]})
    }

    // Pull some relevant channels by grabbing recent messages
    load({
      relays,
      filters,
      onEvent: batch(500, (events: Event[]) => {
        const channelIds = uniq(
          events.filter(e => e.kind === 42).map(e => Tags.from(e).getMeta("e"))
        )

        loadPubkeys(pluck("pubkey", events))

        if (channelIds.length > 0) {
          load({
            relays,
            filters: [
              {kinds: [40], ids: channelIds},
              {kinds: [41], "#e": channelIds},
            ],
          })
        }
      }),
    })

    return () => {
      scroller.stop()
    }
  })
</script>

<Content>
  {#if $canSign}
    <div class="flex justify-between">
      <div class="flex items-center gap-2">
        <i class="fa fa-server fa-lg" />
        <h2 class="staatliches text-2xl">Your rooms</h2>
      </div>
      <Anchor theme="button-accent" on:click={() => modal.push({type: "chat/edit"})}>
        <i class="fa-solid fa-plus" /> Create Room
      </Anchor>
    </div>
    {#each $joined as channel (channel.id)}
      <ChatListItem {channel} />
    {:else}
      <p class="text-center py-8">You haven't yet joined any rooms.</p>
    {/each}
    <div class="mb-2 border-b border-solid border-gray-6 pt-2" />
    <div class="flex items-center gap-2">
      <i class="fa fa-earth-asia fa-lg" />
      <h2 class="staatliches text-2xl">Other rooms</h2>
    </div>
  {/if}
  <div class="flex-grow">
    <Input bind:value={q} type="text" placeholder="Search rooms">
      <i slot="before" class="fa-solid fa-search" />
    </Input>
  </div>
  {#each results as channel (channel.id)}
    <ChatListItem {channel} />
  {:else}
    <small class="text-center"> No matching rooms found </small>
  {/each}
</Content>
