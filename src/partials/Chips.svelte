<script lang="ts">
  import Chip from "src/partials/Chip.svelte"

  export let items
  export let remove
</script>

<div class="text-sm">
  {#each items as item, i}
    <Chip pad onRemove={() => remove(i)}>
      <slot name="item" context="value" {item}>
        {item}
      </slot>
    </Chip>
  {/each}
</div>
