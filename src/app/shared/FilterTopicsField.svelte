<script lang="ts">
  import Field from "src/partials/Field.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {searchTopicNames} from "src/engine"

  export let filter
  export let onChange
  export let onRemove

  const change = topics => onChange({...filter, "#t": topics})
</script>

<Field>
  <span slot="label" class="flex cursor-pointer items-center gap-2" on:click={onRemove}>
    <i class="fa fa-trash fa-sm" /> Topics
  </span>
  <SearchSelect multiple search={$searchTopicNames} value={filter["#t"] || []} onChange={change} />
</Field>
