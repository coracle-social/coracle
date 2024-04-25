<script lang="ts">
  import {createLocalDate, dateToSeconds, formatTimestampAsDate} from "src/util/misc"
  import Field from "src/partials/Field.svelte"
  import DateInput from "src/partials/DateInput.svelte"

  export let filter
  export let onChange
  export let onRemove

  const changeSince = since =>
    onChange({...filter, since: dateToSeconds(createLocalDate(since).setHours(0, 0, 0, 0))})

  const changeUntil = until =>
    onChange({...filter, until: dateToSeconds(createLocalDate(until).setHours(23, 59, 59, 0))})
</script>

<div class="grid grid-cols-2 gap-2">
  <Field>
    <span slot="label" class="flex cursor-pointer items-center gap-2" on:click={onRemove}>
      <i class="fa fa-trash fa-sm" /> Since
    </span>
    <DateInput
      value={filter.since ? formatTimestampAsDate(filter.since) : null}
      onChange={changeSince} />
  </Field>
  <Field label="Until">
    <DateInput
      value={filter.until ? formatTimestampAsDate(filter.until) : null}
      onChange={changeUntil} />
  </Field>
</div>
