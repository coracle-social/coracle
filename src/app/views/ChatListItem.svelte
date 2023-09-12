<script lang="ts">
  import {nip19} from "nostr-tools"
  import {navigate} from "svelte-routing"
  import {fly} from "src/util/transition"
  import {ellipsize} from "hurdak"
  import Anchor from "src/partials/Anchor.svelte"
  import {canSign, imgproxy, joinNip28Channel, leaveNip28Channel} from "src/engine2"

  export let channel

  const enter = () => navigate(`/chat/${nip19.noteEncode(channel.id)}`)
  const join = () => joinNip28Channel(channel.id)
  const leave = () => leaveNip28Channel(channel.id)

  // Accommodate data urls from legacy
  const picture =
    channel.picture?.length > 500 ? channel.picture : imgproxy(channel.picture, {w: 112, h: 112})

  $: notify =
    channel.nip28.joined && (channel.last_checked || channel.last_sent) < channel.last_received
</script>

<button
  class="relative flex cursor-pointer gap-4 rounded border border-solid border-gray-6 bg-gray-7 px-4 py-6 transition-all hover:bg-gray-6"
  on:click={enter}
  in:fly={{y: 20}}>
  <div
    class="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-solid border-white bg-cover bg-center"
    style={`background-image: url(${picture})`} />
  {#if notify}
    <div class="absolute left-2 top-2 h-2 w-2 rounded bg-accent" />
  {/if}
  <div class="flex min-w-0 flex-grow flex-col justify-start gap-2">
    <div class="flex flex-grow items-start justify-between gap-2">
      <h2 class="text-lg">
        {channel.name || ""}
      </h2>
      {#if channel.nip28.joined}
        <Anchor theme="button" killEvent class="flex items-center gap-2" on:click={leave}>
          <i class="fa fa-right-from-bracket" />
          <span>Leave</span>
        </Anchor>
      {:else if $canSign}
        <Anchor theme="button" killEvent class="flex items-center gap-2" on:click={join}>
          <i class="fa fa-right-to-bracket" />
          <span>Join</span>
        </Anchor>
      {/if}
    </div>
    {#if channel.about}
      <p class="text-start text-gray-1">
        {ellipsize(channel.about, 300)}
      </p>
    {/if}
  </div>
</button>
