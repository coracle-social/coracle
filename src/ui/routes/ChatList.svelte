<script>
  import {onMount} from "svelte"
  import {fuzzy} from "src/util/misc"
  import Input from "src/ui/partials/Input.svelte"
  import Content from "src/ui/partials/Content.svelte"
  import Anchor from "src/ui/partials/Anchor.svelte"
  import ChatListItem from "src/ui/views/chat/ChatListItem.svelte"
  import {watch} from "src/agent/storage"
  import network from "src/agent/network"
  import {getUserReadRelays} from "src/agent/relays"
  import {modal} from "src/app/ui"

  let q = ""
  let search
  let results = []

  const userRooms = watch("rooms", t => t.all({joined: true}))
  const otherRooms = watch("rooms", t => t.all({"joined:!eq": true}))

  $: search = fuzzy($otherRooms, {keys: ["name", "about"]})
  $: results = search(q).slice(0, 50)

  document.title = "Chat"

  onMount(() => {
    const sub = network.listen({
      relays: getUserReadRelays(),
      filter: [{kinds: [40, 41]}],
    })

    return () => {
      sub.then(s => s?.unsub())
    }
  })
</script>

<Content>
  <div class="flex justify-between">
    <div class="flex items-center gap-2">
      <i class="fa fa-server fa-lg" />
      <h2 class="staatliches text-2xl">Your rooms</h2>
    </div>
    <Anchor type="button-accent" on:click={() => modal.set({type: "room/edit"})}>
      <i class="fa-solid fa-plus" /> Create Room
    </Anchor>
  </div>
  {#each $userRooms as room (room.id)}
    <ChatListItem {room} />
  {:else}
    <p class="text-center py-8">You haven't yet joined any rooms.</p>
  {/each}
  <div class="mb-2 border-b border-solid border-gray-6 pt-2" />
  <div class="flex items-center gap-2">
    <i class="fa fa-earth-asia fa-lg" />
    <h2 class="staatliches text-2xl">Other rooms</h2>
  </div>
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
      Showing {Math.min(50, $otherRooms.length)} of {$otherRooms.length} known rooms
    </small>
  {:else}
    <small class="text-center"> No matching rooms found </small>
  {/if}
</Content>
