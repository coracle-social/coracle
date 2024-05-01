<script lang="ts">
  import {pluck, identity} from "ramda"
  import {append, randomId} from "@welshman/lib"
  import {fuzzy} from "src/util/misc"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Field from "src/partials/Field.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import {searchRelayUrls, normalizeRelayUrl, displayRelayUrl} from "src/engine"

  export let dvmItem
  export let onChange

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
    {label: "Person Search", kind: 5303},
  ]

  const searchKindItems = fuzzy(kinds, {keys: ["kind", "label"]})

  const searchKinds = term => pluck("kind", searchKindItems(term.toString()))

  const displayKind = kind => {
    const option = kinds.find(k => k.kind === kind)

    return option ? `${option.label} (kind ${kind})` : `Kind ${kind}`
  }

  let key = randomId()
</script>

<FlexColumn class="relative">
  <Field label="Kind">
    <SearchSelect
      search={searchKinds}
      value={dvmItem.kind}
      onChange={setKind}
      termToItem={identity}>
      <div slot="item" let:item>{displayKind(item)}</div>
    </SearchSelect>
  </Field>
  <Field label="Relays">
    <SearchSelect
      multiple
      value={dvmItem.relays || []}
      search={$searchRelayUrls}
      termToItem={normalizeRelayUrl}
      onChange={relays => onChange({...dvmItem, relays})}>
      <span slot="item" let:item>{displayRelayUrl(item)}</span>
    </SearchSelect>
    <p slot="info">Select which relays requests to this DVM should be sent to.</p>
  </Field>
  {#each dvmItem.tags || [] as [type, value], i (i + key)}
    <div class="flex items-center justify-between gap-2">
      <i class="fa fa-trash cursor-pointer" on:click={() => removeTag(i)} />
      <div class="flex items-center justify-end gap-2">
        <div class="flex items-center gap-3">
          <label>Type</label>
          <Input bind:value={type} on:change={() => onChange(dvmItem)} />
        </div>
        <div class="flex items-center gap-3">
          <label>Value</label>
          <Input bind:value on:change={() => onChange(dvmItem)} />
        </div>
      </div>
    </div>
  {/each}
  <Anchor on:click={addTag} class="cursor-pointer">
    <i class="fa fa-plus" /> Add tag
  </Anchor>
</FlexColumn>
