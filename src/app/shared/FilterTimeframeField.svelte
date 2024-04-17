<script lang="ts">
  import {prop} from "ramda"
  import {Scope} from '@coracle.social/feeds'
  import {fuzzy} from 'src/util/misc'
  import Field from "src/partials/Field.svelte"
  import DateInput from "src/partials/DateInput.svelte"
  import {searchPubkeys, displayPubkey} from 'src/engine'

  export let filter
  export let onChange
  export let onRemove

  const changeSince = since => onChange({...filter, since})

  const changeUntil = until => onChange({...filter, until})
</script>

<div class="grid grid-cols-2 gap-2">
  <Field>
    <span slot="label" class="flex gap-2 items-center cursor-pointer" on:click={onRemove}>
      <i class="fa fa-trash fa-sm" /> Since
    </span>
    <DateInput value={filter.since} onChange={changeSince} />
  </Field>
  <Field label="Until">
    <DateInput value={filter.until} onChange={changeUntil} />
  </Field>
</div>
