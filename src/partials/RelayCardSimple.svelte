<script lang="ts">
  import {last} from 'ramda'
  import {fly} from 'svelte/transition'
  import {stringToColor} from "src/util/misc"

  export let relay
</script>

<div
  class="rounded border border-l-2 border-solid border-medium shadow flex flex-col
         justify-between gap-3 py-3 px-6"
  style={`border-left-color: ${stringToColor(relay.url)}`}
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
