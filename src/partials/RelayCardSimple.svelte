<script lang="ts">
  import {last} from 'ramda'
  import {fly} from 'svelte/transition'

  export let relay
</script>

<div
  class="rounded border border-solid border-medium bg-dark shadow flex flex-col justify-between gap-3 py-3 px-6"
  in:fly={{y: 20}}>
  <div class="flex gap-2 items-center justify-between">
    <div class="flex gap-2 items-center text-xl">
      <i class={relay.url.startsWith('wss') ? "fa fa-lock" : "fa fa-unlock"} />
      <span>{last(relay.url.split('://'))}</span>
    </div>
    <slot name="actions" />
  </div>
  {#if relay.description}
  <p>{relay.description}</p>
  {/if}
</div>
