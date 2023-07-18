<script>
  import {onMount} from "svelte"
  import {partition, pluck, filter, whereEq, uniq, prop} from "ramda"
  import {now, timedelta, batch} from "src/util/misc"
  import {Tags} from "src/util/nostr"
  import {modal} from "src/partials/state"
  import Input from "src/partials/Input.svelte"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import ChatListItem from "src/app/views/ChatListItem.svelte"
  import {PubkeyLoader, Nip28, Nip65, Network, Keys} from "src/app/engine"

  let q = ""
  let results = []
  let joinedChannels = []
  let otherChannels = []

  const {searchChannels} = Nip28
  const channels = Nip28.channels.derived(filter(whereEq({type: "public"})))

  $: [joinedChannels, otherChannels] = partition(prop("joined"), $channels)
  $: results = $searchChannels(q)
    .filter(c => c.type === "public" && !c.joined)
    .slice(0, 50)

  document.title = "Chat"

  onMount(() => {
    const subs = []
    const relays = Nip65.getPubkeyHints(3, Keys.pubkey.get(), "read")

    subs.push(
      Network.subscribe({
        relays,
        autoClose: true,
        filter: [{kinds: [42], since: now() - timedelta(1, "days"), limit: 100}],
        onEvent: batch(500, events => {
          const channelIds = uniq(events.map(e => Tags.from(e).getMeta("e")))

          PubkeyLoader.load(pluck("pubkey", events))

          subs.push(
            Network.subscribe({
              relays,
              autoClose: true,
              filter: [
                {kinds: [40], ids: channelIds},
                {kinds: [41], "#e": channelIds},
              ],
            })
          )
        }),
      })
    )

    return () => {
      subs.map(s => s.close())
    }
  })
</script>

<Content>
  {#if Keys.canSign.get()}
    <div class="flex justify-between">
      <div class="flex items-center gap-2">
        <i class="fa fa-server fa-lg" />
        <h2 class="staatliches text-2xl">Your rooms</h2>
      </div>
      <Anchor theme="button-accent" on:click={() => modal.push({type: "channel/edit"})}>
        <i class="fa-solid fa-plus" /> Create Room
      </Anchor>
    </div>
    {#each joinedChannels as channel (channel.id)}
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
  {#if results.length > 0}
    {#each results as channel (channel.id)}
      <ChatListItem {channel} />
    {/each}
    <small class="text-center">
      Showing {Math.min(50, otherChannels.length)} of {otherChannels.length} known rooms
    </small>
  {:else}
    <small class="text-center"> No matching rooms found </small>
  {/if}
</Content>
