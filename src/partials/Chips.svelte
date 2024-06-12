<script lang="ts">
  import Chip from "src/partials/Chip.svelte"

  export let items
  export let remove = null
</script>

<div class="text-sm">
  {#each items as item, i}
    {@const onRemove = remove ? () => remove(i) : null}
    <Chip pad {onRemove}>
      <slot name="item" context="value" {item}>
        {item}
      </slot>
    </Chip>
  {/each}
</div>
