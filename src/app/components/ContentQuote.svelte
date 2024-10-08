<script lang="ts">
  import {Address} from "@welshman/util"
  import Spinner from "@lib/components/Spinner.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import {deriveEvent} from "@app/state"

  export let value
  export let depth = 0

  const {id, identifier, kind, pubkey, relays} = value
  const idOrAddress = id || new Address(kind, pubkey, identifier).toString()
  const event = deriveEvent(idOrAddress, relays)

  let element: Element
</script>

<button class="my-2 block max-w-full text-left" bind:this={element} on:click|stopPropagation>
  {#if $event}
    <NoteCard event={$event} class="bg-alt rounded-box p-4">
      <slot name="note-content" event={$event} {depth} />
    </NoteCard>
  {:else}
    <div class="rounded-box p-4">
      <Spinner loading>Loading event...</Spinner>
    </div>
  {/if}
</button>
