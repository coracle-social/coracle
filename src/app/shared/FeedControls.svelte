<script lang="ts">
  import {writable} from "@coracle.social/lib"
  import Chip from "src/partials/Chip.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Modal from "src/partials/Modal.svelte"

  export let value

  const isOpen = writable(false)

  const toggleReplies = () => {
    value = {...value, shouldHideReplies: !value.shouldHideReplies}
  }

  const saveFeed = () => {
    value = {...value, feed}
  }

  $: feed = value.feed
</script>

<div class="-mb-2">
  <div class="float-right flex justify-end">
    <div class="flex items-center gap-1 px-2">
      <Toggle scale={0.6} value={!value.shouldHideReplies} on:change={toggleReplies} />
      <small class="text-neutral-200">Show replies</small>
    </div>
    <i class="fa fa-search cursor-pointer p-2" on:click={() => isOpen.set(true)} />
    <slot name="controls" />
  </div>
  <div class="mb-2 mr-2 inline-block py-1">Showing notes:</div>
  <Chip class="mb-2 mr-2 inline-block">From TBD</Chip>
  <div
    class="inline-block rounded-full border border-neutral-100"
    on:click={() => isOpen.set(true)}>
    <div class="flex h-7 w-7 items-center justify-center">
      <i class="fa fa-plus cursor-pointer" />
    </div>
  </div>
</div>

{#if $isOpen}
  <Modal onEscape={() => isOpen.set(false)}></Modal>
{/if}
