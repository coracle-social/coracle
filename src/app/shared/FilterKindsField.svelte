<script lang="ts">
  import {pluck, identity} from "ramda"
  import {fuzzy} from "src/util/misc"
  import Field from "src/partials/Field.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"

  export let filter
  export let onChange
  export let onRemove

  const change = kinds => onChange({...filter, kinds})

  const kinds = [
    {label: "Note", kind: 1},
    {label: "Profile", kind: 0},
    {label: "Reaction", kind: 7},
    {label: "Live chat", kind: 1311},
    {label: "Remix", kind: 1808},
    {label: "Audio", kind: 31337},
    {label: "Report", kind: 1984},
    {label: "Label", kind: 1985},
    {label: "Review", kind: 1986},
    {label: "Highlight", kind: 9802},
    {label: "Article", kind: 30023},
    {label: "Live event", kind: 30311},
    {label: "Status", kind: 30315},
    {label: "Listing", kind: 30402},
    {label: "Calendar event (date based)", kind: 31922},
    {label: "Calendar event (time based)", kind: 31923},
    {label: "Calendar event RSVP", kind: 31925},
    {label: "Handler recommendation", kind: 31989},
    {label: "Handler information", kind: 31990},
    {label: "Community definition", kind: 34550},
    {label: "Group definition", kind: 35834},
    {label: "Image", kind: 1063},
    {label: "Relay selections", kind: 10002},
  ]

  const searchKindItems = fuzzy(kinds, {keys: ["kind", "label"]})

  const searchKinds = term => pluck("kind", searchKindItems(term))

  const displayKind = kind => {
    const option = kinds.find(k => k.kind === kind)

    return option ? `${option.label} (kind ${kind})` : `Kind ${kind}`
  }
</script>

<Field>
  <span slot="label" class="flex cursor-pointer items-center gap-2" on:click={onRemove}>
    <i class="fa fa-trash fa-sm" /> Kinds
  </span>
  <SearchSelect multiple search={searchKinds} value={filter.kinds || []} onChange={change} termToItem={identity}>
    <div slot="item" let:item>{displayKind(item)}</div>
  </SearchSelect>
</Field>
