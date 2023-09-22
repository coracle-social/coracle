<script lang="ts">
  import {fly} from "src/util/transition"
  import {pluck, find, propEq, prop, equals, omit, objOf} from "ramda"
  import {displayList} from "hurdak"
  import {debounce} from "throttle-debounce"
  import {createLocalDate, fuzzy, formatTimestampAsDate} from "src/util/misc"
  import {noteKinds} from "src/util/nostr"
  import Chip from "src/partials/Chip.svelte"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Content from "src/partials/Content.svelte"
  import SelectButton from "src/partials/SelectButton.svelte"
  import MultiSelect from "src/partials/MultiSelect.svelte"
  import PersonMultiSelect from "src/app/shared/PersonMultiSelect.svelte"
  import type {DynamicFilter, Topic, Person} from "src/engine"
  import {follows, searchTopics, derivePerson, displayPubkey} from "src/engine"

  export let filter
  export let onChange

  type Kind = {
    kind: number
    label: string
  }

  const kinds = [
    {kind: 0, label: "Profile data"},
    {kind: 3, label: "Contacts list"},
    {kind: 7, label: "Reaction"},
    {kind: 1, label: "Text note"},
    {kind: 1808, label: "Track"},
    {kind: 1985, label: "Label"},
    {kind: 1063, label: "Image data"},
    {kind: 9735, label: "Reaction"},
    {kind: 9802, label: "Highlights"},
    {kind: 10002, label: "Relay selections"},
    {kind: 30023, label: "Long form content"},
  ]

  const searchKinds = fuzzy(kinds, {keys: ["kind", "label"]})

  const displayPeople = pubkeys =>
    pubkeys.length === 1 ? displayPubkey(pubkeys[0]) : `${pubkeys.length} people`

  const displayTopics = topics => (topics.length === 1 ? topics[0] : `${topics.length} topics`)

  const getFilterParts = filter => {
    const parts = []

    if (filter.kinds && !equals(filter.kinds, noteKinds)) {
      parts.push({keys: null, label: `Kinds ${displayList(filter.kinds)}`})
    }

    if (typeof filter.authors === "string") {
      parts.push({keys: null, label: `From ${filter.authors}`})
    } else if (filter.authors?.length > 0) {
      parts.push({keys: null, label: `By ${displayPeople(filter.authors)}`})
    }

    if (filter["#p"]?.length > 0) {
      parts.push({keys: ["#p"], label: `Mentioning ${displayPeople(filter["#p"])}`})
    }

    if (filter["#t"]?.length > 0) {
      parts.push({keys: ["#t"], label: `Related to ${displayTopics(filter["#t"])}`})
    }

    if (filter.search) {
      parts.push({keys: ["search"], label: `Matching ${filter.search}`})
    }

    if (filter.since && filter.until) {
      const since = formatTimestampAsDate(filter.since)
      const until = formatTimestampAsDate(filter.until)

      parts.push({keys: ["since", "until"], label: `Between ${since} and ${until}`})
    } else if (filter.since) {
      parts.push({keys: ["since"], label: `After ${formatTimestampAsDate(filter.since)}`})
    } else if (filter.until) {
      parts.push({keys: ["until"], label: `Before ${formatTimestampAsDate(filter.until)}`})
    }

    return parts
  }

  const removePart = keys => {
    filter = omit(keys, filter)
    _filter = getFormFilter()

    onChange(filter)
  }

  const applyFilter = () => {
    const newFilter: DynamicFilter = {kinds: noteKinds}

    if (_filter.kinds?.length > 0) {
      newFilter.kinds = pluck("kind", _filter.kinds)
    } else {
      newFilter.kinds = noteKinds
    }

    if (_filter.since) {
      newFilter.since = createLocalDate(_filter.since).setHours(23, 59, 59, 0) / 1000
    }

    if (_filter.until) {
      newFilter.until = createLocalDate(_filter.until).setHours(23, 59, 59, 0) / 1000
    }

    if (_filter.search) {
      newFilter.search = _filter.search
    }

    if (_filter["#t"].length > 0) {
      newFilter["#t"] = pluck("name", _filter["#t"])
    }

    if (_filter["#p"].length > 0) {
      newFilter["#p"] = pluck("pubkey", _filter["#p"])
    }

    if (Array.isArray(_filter.authors)) {
      newFilter.authors =
        _filter.authors.length > 0 ? (pluck("pubkey", _filter.authors) as string[]) : "global"
    } else {
      newFilter.authors = _filter.authors
    }

    onChange(newFilter)
  }

  const applySearch = debounce(400, applyFilter)

  const clearSearch = () => {
    _filter.search = ""
    applyFilter()
  }

  const onScopeChange = scope => {
    _filter = {..._filter, authors: scope === "custom" ? [] : scope}
  }

  const getFormFilter = () => ({
    kinds: filter.kinds?.map(k => find(propEq("kind", k), kinds)),
    since: filter.since,
    until: filter.until,
    search: filter.search || "",
    authors: Array.isArray(filter.authors)
      ? filter.authors.map(pk => derivePerson(pk).get())
      : filter.authors || "network",
    "#t": (filter["#t"] || []).map(objOf("name")),
    "#p": (filter["#p"] || []).map(pk => derivePerson(pk).get()),
  })

  const open = () => {
    modal = "maxi"
  }

  const onEscape = () => {
    modal = null
  }

  const submit = () => {
    onEscape()
    applyFilter()
  }

  let modal = null
  let scopeOptions = []
  let _filter: {
    kinds?: Kind[]
    since?: number
    until?: number
    search?: string
    authors?: Person[]
    "#t"?: Topic[]
    "#p"?: Person[]
  } = getFormFilter()

  $: parts = getFilterParts(filter)

  $: {
    scopeOptions =
      $follows.size > 0
        ? ["follows", "network", "global", "custom"]
        : ["network", "global", "custom"]
  }
</script>

<div in:fly={{y: 20}}>
  <div class="float-right flex justify-end gap-1">
    <i
      class="fa fa-search cursor-pointer p-2"
      on:click={() => {
        modal = modal ? null : "mini"
      }} />
    <i class="fa fa-sliders cursor-pointer p-2" on:click={open} />
    <slot name="controls" />
  </div>
  {#if parts.length > 0}
    <div class="mb-2 mr-2 inline-block py-1">Showing notes:</div>
  {/if}
  {#each parts as { keys, label }}
    <Chip class="mb-2 mr-2 inline-block" onClick={keys ? () => removePart(keys) : null}
      >{label}</Chip>
  {/each}
</div>

{#if modal}
  <Modal {onEscape} mini={modal === "mini"}>
    <form on:submit|preventDefault={submit}>
      <Content size="lg">
        <div class="flex flex-col gap-1">
          <strong>Search</strong>
          <Input autofocus bind:value={_filter.search} on:input={applySearch}>
            <i slot="before" class="fa fa-search" />
            <i slot="after" class="fa fa-times cursor-pointer" on:click={clearSearch} />
          </Input>
        </div>
        {#if modal === "maxi"}
          <div class="grid grid-cols-2 gap-2">
            <div class="flex flex-col gap-1">
              <strong>Since</strong>
              <Input type="date" bind:value={_filter.since} />
            </div>
            <div class="flex flex-col gap-1">
              <strong>Until</strong>
              <Input type="date" bind:value={_filter.until} />
            </div>
          </div>
          <div class="flex flex-col gap-1">
            <strong>Kinds</strong>
            <MultiSelect search={searchKinds} bind:value={_filter.kinds} getKey={prop("kind")}>
              <div slot="item" let:item>{item.label} (kind {item.kind})</div>
            </MultiSelect>
          </div>
          <div class="flex flex-col gap-1">
            <strong>Authors</strong>
            <SelectButton
              onChange={onScopeChange}
              value={typeof _filter.authors === "string" ? _filter.authors : "custom"}
              options={scopeOptions} />
            {#if Array.isArray(_filter.authors)}
              <PersonMultiSelect bind:value={_filter.authors} />
            {/if}
          </div>
          <div class="flex flex-col gap-1">
            <strong>Topics</strong>
            <MultiSelect search={$searchTopics} bind:value={_filter["#t"]}>
              <div slot="item" let:item>
                <div class="-my-1">
                  #{item.name}
                </div>
              </div>
            </MultiSelect>
          </div>
          <div class="flex flex-col gap-1">
            <strong>Mentions</strong>
            <PersonMultiSelect bind:value={_filter["#p"]} />
          </div>
          <div class="flex justify-end">
            <Anchor theme="button-accent" on:click={submit}>Apply Filters</Anchor>
          </div>
        {/if}
      </Content>
    </form>
  </Modal>
{/if}
