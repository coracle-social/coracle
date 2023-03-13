<script lang="ts">
  import {last} from "ramda"
  import {fly} from "svelte/transition"
  import {stringToHue, hsl} from "src/util/misc"

  export let relay
</script>

<div
  class="flex flex-col justify-between gap-3 rounded border border-l-2 border-solid
         border-medium py-3 px-6 shadow"
  style={`border-left-color: ${hsl(stringToHue(relay.url))}`}
  in:fly={{y: 20}}>
  <div class="flex items-center justify-between gap-2">
    <div class="flex items-center gap-2 text-xl">
      <i class={relay.url.startsWith("wss") ? "fa fa-lock" : "fa fa-unlock"} />
      <span>{last(relay.url.split("://"))}</span>
    </div>
    <slot name="actions" />
  </div>
  {#if relay.description}
    <p>{relay.description}</p>
  {/if}
</div>
