<script lang="ts">
  import {omit} from 'ramda'
  import Field from 'src/partials/Field.svelte'
  import Input from 'src/partials/Input.svelte'

  export let filter
  export let onChange
  export let onRemove

  const change = e => onChange({...filter, search: e.target.value})
</script>

<Field>
  <span slot="label" class="flex gap-2 items-center cursor-pointer" on:click={onRemove}>
    <i class="fa fa-trash fa-sm" /> Search
  </span>
  <Input value={filter.search} on:change={change}>
    <i slot="before" class="fa fa-search" />
  </Input>
</Field>
