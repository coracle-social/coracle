<script lang="ts">
  import {omit, prop} from "ramda"
  import {fuzzy} from 'src/util/misc'
  import Field from "src/partials/Field.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import {searchTopics} from 'src/engine'

  export let filter
  export let onChange
  export let onRemove

  const change = topics => onChange({...filter, '#t': topics})
</script>

<Field>
  <span slot="label" class="flex gap-2 items-center cursor-pointer" on:click={onRemove}>
    <i class="fa fa-trash fa-sm" /> Topics
  </span>
  <SearchSelect multiple search={$searchTopics} value={filter['#t'] || []} onChange={change} />
</Field>
