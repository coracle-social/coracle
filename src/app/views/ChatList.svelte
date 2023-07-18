<script>
  import {onMount} from "svelte"
  import {debounce} from "throttle-debounce"
  import {complement, sortBy, pipe, pluck, filter, uniq, prop} from "ramda"
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

  const channels = Nip28.channels.derived(
    pipe(
      filter(prop("name")),
      sortBy(c => -(c.last_sent || c.last_received))
    )
  )
  const joined = channels.derived(filter(prop("joined")))
  const other = channels.derived(filter(complement(prop("joined"))))
  const search = Nip28.getSearchChannels(other)

  const searchChannels = debounce(500, q => {
    if (q.length > 3) {
      Network.subscribe({
        timeout: 5000,
        relays: Nip65.getSearchRelays(),
        filter: [{kinds: [40, 41], search: q}],
      })
    }
  })

  $: searchChannels(q)
  $: results = $search(q).slice(0, 50)

  document.title = "Chat"

  onMount(() => {
    const subs = []
    const relays = Nip65.getPubkeyHints(3, Keys.pubkey.get(), "read")

    // Pull some relevant channels by grabbing recent messages
    subs.push(
      Network.subscribe({
        relays,
        timeout: 2000,
        filter: [{kinds: [42], since: now() - timedelta(1, "days"), limit: 100}],
        onEvent: batch(500, events => {
          const channelIds = uniq(events.map(e => Tags.from(e).getMeta("e")))

          PubkeyLoader.load(pluck("pubkey", events))

          subs.push(
            Network.subscribe({
              relays,
              timeout: 2000,
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
  {#if results.length > 0}
    {#each results as channel (channel.id)}
      <ChatListItem {channel} />
    {/each}
    <small class="text-center">
      Showing {Math.min(50, $other.length)} of {$other.length} known rooms
    </small>
  {:else}
    <small class="text-center"> No matching rooms found </small>
  {/if}
</Content>
