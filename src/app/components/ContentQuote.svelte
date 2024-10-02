<script lang="ts">
  import {onMount} from 'svelte'
  import {getAddress, Address} from "@welshman/util"
  import Spinner from "@lib/components/Spinner.svelte"
  import NoteCard from "@app/components/NoteCard.svelte"
  import {deriveEvent} from "@app/state"

  export let value
  export let depth = 0

  const {id, identifier, kind, pubkey, relays} = value
  const idOrAddress = id || new Address(kind, pubkey, identifier).toString()
  const event = deriveEvent(idOrAddress, relays)

  let element: Element
  let bgClass = "bg-base-300"

  $: address = $event ? getAddress($event) : ""
  $: isGroup = address.match(/^(34550|35834):/)

  onMount(() => {
    if (element.closest('.bg-base-300')) {
      bgClass = 'bg-base-100'
    }
  })
</script>

<button class="block text-left my-2 max-w-full" bind:this={element} on:click|stopPropagation>
  {#if $event}
    <NoteCard event={$event} class="p-4 rounded-box {bgClass}">
      <slot name="note-content" event={$event} {depth} />
    </NoteCard>
  {:else}
    <div class="p-4 rounded-box {bgClass}">
      <Spinner loading>Loading event...</Spinner>
    </div>
  {/if}
</button>
