<script lang="ts">
  import {pluck} from "ramda"
  import {append, randomId} from "@welshman/lib"
  import {fuzzy} from "src/util/misc"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Field from "src/partials/Field.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import {searchRelayUrls, displayRelayUrl} from "src/engine"

  export let dvmItem
  export let onChange
  export let onRemove

  const removeTag = i => {
    onChange({...dvmItem, tags: dvmItem.tags.toSpliced(i, 1)})
    key = randomId()
  }

  const addTag = () => {
    onChange({...dvmItem, tags: append(dvmItem.tags, ["", ""])})
    key = randomId()
  }

  const setKind = kind => onChange({...dvmItem, kind: parseInt(kind)})

  const kinds = [
    {label: "Content discovery", kind: 5300},
    {label: "Person discovery", kind: 5301},
    {label: "Content search", kind: 5302},
  ]

  const searchKindItems = fuzzy(kinds, {keys: ["kind", "label"]})

  const searchKinds = term => pluck("kind", searchKindItems(term.toString()))

  let key = randomId()
</script>

<FlexColumn class="relative">
  <Field label="Kind">
    <SearchSelect search={searchKinds} value={dvmItem.kind} onChange={setKind}>
      <div slot="item" let:item>{kinds.find(k => k.kind === item)?.label} (kind {item})</div>
    </SearchSelect>
  </Field>
  <Field label="Relays">
    <SearchSelect
      multiple
      value={dvmItem.relays}
      search={$searchRelayUrls}
      onChange={relays => onChange({...dvmItem, relays})}>
      <span slot="item" let:item>{displayRelayUrl(item)}</span>
    </SearchSelect>
    <p slot="info">Select which relays requests to this DVM should be sent to.</p>
  </Field>
  {#each dvmItem.tags as [type, value], i (i + key)}
    <div class="flex gap-2 items-center justify-between">
      <i class="fa fa-trash cursor-pointer" on:click={() => removeTag(i)} />
      <div class="flex gap-2 items-center justify-end">
        <div class="flex gap-3 items-center">
          <label>Type</label>
          <Input bind:value={type} on:change={() => onChange(dvmItem)} />
        </div>
        <div class="flex gap-3 items-center">
          <label>Value</label>
          <Input bind:value={value} on:change={() => onChange(dvmItem)} />
        </div>
      </div>
    </div>
  {/each}
  <Anchor on:click={addTag} class="cursor-pointer">
    <i class="fa fa-plus" /> Add tag
  </Anchor>
  <div class="absolute -right-4 -top-2 flex h-4 w-4 cursor-pointer items-center justify-center" on:click={onRemove}>
    <i class="fa fa-times fa-lg" />
  </div>
</FlexColumn>
