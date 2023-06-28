<script>
  import {onMount} from "svelte"
  import {derived} from "svelte/store"
  import {partition} from "ramda"
  import {fuzzy} from "src/util/misc"
  import {modal} from "src/partials/state"
  import Input from "src/partials/Input.svelte"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import ChatListItem from "src/app/views/ChatListItem.svelte"
  import {keys} from "src/system"
  import {watch} from "src/agent/db"
  import user from "src/agent/user"
  import network from "src/agent/network"
  import {getUserReadRelays, sampleRelays} from "src/agent/relays"

  let q = ""
  let search
  let results = []

  const {canSign} = keys
  const {roomsJoined} = user
  const rooms = derived([watch("rooms", t => t.all()), roomsJoined], ([_rooms, _joined]) => {
    const ids = new Set(_joined)
    const [joined, other] = partition(r => ids.has(r.id), _rooms)

    return {joined, other}
  })

  $: search = fuzzy($rooms.other, {keys: ["name", "about"]})
  $: results = search(q).slice(0, 50)

  document.title = "Chat"

  onMount(() => {
    const sub = network.listen({
      relays: sampleRelays(getUserReadRelays()),
      filter: [{kinds: [40, 41]}],
    })

    return () => {
      sub.then(s => s?.unsub())
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
      <Anchor theme="button-accent" on:click={() => modal.push({type: "room/edit"})}>
        <i class="fa-solid fa-plus" /> Create Room
      </Anchor>
    </div>
    {#each $rooms.joined as room (room.id)}
      <ChatListItem {room} />
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
    {#each results as room (room.id)}
      <ChatListItem {room} />
    {/each}
    <small class="text-center">
      Showing {Math.min(50, $rooms.other.length)} of {$rooms.other.length} known rooms
    </small>
  {:else}
    <small class="text-center"> No matching rooms found </small>
  {/if}
</Content>
