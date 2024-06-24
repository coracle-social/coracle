<script lang="ts">
  import {displayGroupMeta} from "src/domain"
  import {deriveGroupMeta} from "src/engine"

  export let address

  const meta = deriveGroupMeta(address)

  $: display = displayGroupMeta($meta)
</script>

<span class={$$props.class} class:text-neutral-400={display === '[no name]'}>{display}</span>
