<script>
  import {onMount} from "svelte"
  import {partition, prop} from "ramda"
  import {fuzzy} from "src/util/misc"
  import {modal} from "src/partials/state"
  import Input from "src/partials/Input.svelte"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import ChatListItem from "src/app/views/ChatListItem.svelte"
  import {keys, chat, routing, network} from "src/system"
  import {watch} from "src/util/loki"

  let q = ""
  let search
  let results = []
  let joinedChannels = []
  let otherChannels = []

  const {canSign} = keys
  const channels = watch(chat.channels, () => chat.channels.all({type: "public"}))

  $: [joinedChannels, otherChannels] = partition(prop("joined"), $channels)
  $: search = fuzzy(otherChannels, {keys: ["name", "about"]})
  $: results = search(q).slice(0, 50)

  document.title = "Chat"

  onMount(() => {
    const sub = network.subscribe({
      relays: routing.getUserHints(3, "read"),
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
