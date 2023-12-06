<script lang="ts">
  import {pluck, not, prop, equals, omit, objOf} from "ramda"
  import {displayList} from "hurdak"
  import {createLocalDate, dateToSeconds, fuzzy, formatTimestampAsDate} from "src/util/misc"
  import {noteKinds} from "src/util/nostr"
  import {getKey} from "src/util/router"
  import Chip from "src/partials/Chip.svelte"
  import Menu from "src/partials/Menu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import Toggle from "src/partials/Toggle.svelte"
  import Input from "src/partials/Input.svelte"
  import Popover from "src/partials/Popover.svelte"
  import DateInput from "src/partials/DateInput.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Content from "src/partials/Content.svelte"
  import SelectButton from "src/partials/SelectButton.svelte"
  import SearchSelect from "src/partials/SearchSelect.svelte"
  import PersonMultiSelect from "src/app/shared/PersonMultiSelect.svelte"
  import {router} from "src/app/router"
  import type {DynamicFilter, Topic, Person} from "src/engine"
  import {
    follows,
    displayRelays,
    urlToRelay,
    searchTopics,
    derivePerson,
    displayPubkey,
  } from "src/engine"

  export let filter
  export let relays
  export let hideReplies
  export let updateFilter

  type Kind = {
    kind: number
    label: string
  }

  const kinds = [
    {kind: 0, label: "Profile data"},
    {kind: 3, label: "Contacts list"},
    {kind: 7, label: "Reaction"},
    {kind: 1, label: "Text note"},
    {kind: 1808, label: "Remix"},
    {kind: 32123, label: "Song"},
    {kind: 1985, label: "Label"},
    {kind: 1986, label: "Review"},
    {kind: 1063, label: "Image data"},
    {kind: 9735, label: "Reaction"},
    {kind: 9802, label: "Highlights"},
    {kind: 10002, label: "Relay selections"},
    {kind: 30023, label: "Long form content"},
    {kind: 31923, label: "Calendar Event"},
    {kind: 30402, label: "Classified Listing"},
  ]

  const searchKinds = fuzzy(kinds, {keys: ["kind", "label"]})

  const displayPeople = pubkeys =>
    pubkeys.length === 1 ? displayPubkey(pubkeys[0]) : `${pubkeys.length} people`

  const displayTopics = topics => (topics.length === 1 ? topics[0] : `${topics.length} topics`)

  const onChange = filter => {
    onEscape()

    const key = getKey(router.current.get())

    router.fromCurrent().qp({filter}).replace({key})

    updateFilter(filter)
  }

  const removePart = keys => {
    filter = omit(keys, filter)
    _filter = getFormFilter()

    onChange(filter)
  }

  const modifyFilter = updates => {
    filter = {...filter, ...updates}
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
      newFilter.since = dateToSeconds(createLocalDate(_filter.since).setHours(0, 0, 0, 0))
    }

    if (_filter.until) {
      newFilter.until = dateToSeconds(createLocalDate(_filter.until).setHours(23, 59, 59, 0))
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

  const clearSearch = () => {
    _filter.search = ""
  }

  const toggleReplies = () => hideReplies.update(not)

  const onScopeChange = scope => {
    _filter = {..._filter, authors: scope === "custom" ? [] : scope}
  }

  const getFormFilter = () => ({
    kinds: filter.kinds?.map((k: number) => kinds.find(x => x.kind === k)),
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
    isOpen = true
  }

  const onEscape = () => {
    isOpen = false
  }

  let isOpen = false
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

  $: {
    scopeOptions =
      $follows.size > 0
        ? ["follows", "network", "global", "custom"]
        : ["network", "global", "custom"]
  }
</script>

<div>
  <div class="float-right flex justify-end">
    <div class="flex items-center gap-1 pr-2">
      <Toggle scale={0.6} value={!$hideReplies} on:change={toggleReplies} />
      <small class="text-lighter">Show replies</small>
    </div>
    <i class="fa fa-search cursor-pointer p-2" on:click={open} />
    <slot name="controls" />
  </div>
  <div class="mb-2 mr-2 inline-block py-1">Showing notes:</div>
  {#if filter.kinds && !equals(filter.kinds, noteKinds)}
    <Chip class="mb-2 mr-2 inline-block">Kinds {displayList(filter.kinds)}</Chip>
  {/if}
  {#if !filter.authors || typeof filter.authors === "string"}
    <Popover
      class="inline-block"
      placement="bottom-end"
      theme="transparent"
      opts={{hideOnClick: true}}>
      <div slot="trigger" class="cursor-pointer">
        <Chip class="mb-2 mr-2 inline-block">
          From {filter.authors || "global"}
          <i class="fa fa-caret-down p-1" />
        </Chip>
      </div>
      <div slot="tooltip">
        <Menu>
          <MenuItem on:click={() => modifyFilter({authors: "follows"})}>
            <i class="fa fa-user-plus mr-2" /> Follows
          </MenuItem>
          <MenuItem on:click={() => modifyFilter({authors: "network"})}>
            <i class="fa fa-share-nodes mr-2" /> Network
          </MenuItem>
          <MenuItem on:click={() => modifyFilter({authors: "global"})}>
            <i class="fa fa-earth-americas mr-2" /> Global
          </MenuItem>
        </Menu>
      </div>
    </Popover>
  {:else if filter.authors?.length > 0}
    <Chip class="mb-2 mr-2 inline-block">By {displayPeople(filter.authors)}</Chip>
  {/if}
  {#if filter["#p"]?.length > 0}
    <Chip class="mb-2 mr-2 inline-block" onRemove={() => removePart(["#p"])}>
      Mentioning {displayPeople(filter["#p"])}
    </Chip>
  {/if}
  {#if filter["#t"]?.length > 0}
    <Chip class="mb-2 mr-2 inline-block" onRemove={() => removePart(["#t"])}>
      Related to {displayTopics(filter["#t"])}
    </Chip>
  {/if}
  {#if filter.search}
    <Chip class="mb-2 mr-2 inline-block" onRemove={() => removePart(["search"])}>
      Matching {filter.search}
    </Chip>
  {/if}
  {#if filter.since && filter.until}
    {@const since = formatTimestampAsDate(filter.since)}
    {@const until = formatTimestampAsDate(filter.until)}
    <Chip class="mb-2 mr-2 inline-block" onRemove={() => removePart(["since", "until"])}>
      Between {since} and {until}
    </Chip>
  {:else if filter.since}
    <Chip class="mb-2 mr-2 inline-block" onRemove={() => removePart(["since"])}>
      From {formatTimestampAsDate(filter.since)}
    </Chip>
  {:else if filter.until}
    <Chip class="mb-2 mr-2 inline-block" onRemove={() => removePart(["until"])}>
      Through {formatTimestampAsDate(filter.until)}
    </Chip>
  {/if}
  {#if relays.length > 0}
    <Chip class="mb-2 mr-2 inline-block">
      Found on {displayRelays(relays.map(urlToRelay), 2)}
    </Chip>
  {/if}
  <div class="inline-block rounded-full border border-lightest" on:click={open}>
    <div class="flex h-7 w-7 items-center justify-center">
      <i class="fa fa-plus cursor-pointer" />
    </div>
  </div>
</div>

{#if isOpen}
  <Modal {onEscape}>
    <form on:submit|preventDefault={applyFilter}>
      <Content size="lg">
        <div class="flex flex-col gap-1">
          <strong>Search</strong>
          <Input autofocus bind:value={_filter.search}>
            <i slot="before" class="fa fa-search" />
            <i slot="after" class="fa fa-times cursor-pointer" on:click={clearSearch} />
          </Input>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="flex flex-col gap-1">
            <strong>Since</strong>
            <DateInput bind:value={_filter.since} />
          </div>
          <div class="flex flex-col gap-1">
            <strong>Until</strong>
            <DateInput bind:value={_filter.until} />
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <strong>Kinds</strong>
          <SearchSelect
            multiple
            search={searchKinds}
            bind:value={_filter.kinds}
            getKey={prop("kind")}>
            <div slot="item" let:item>{item.label} (kind {item.kind})</div>
          </SearchSelect>
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
          <SearchSelect multiple search={$searchTopics} bind:value={_filter["#t"]}>
            <div slot="item" let:item>
              <div class="-my-1">
                #{item.name}
              </div>
            </div>
          </SearchSelect>
        </div>
        <div class="flex flex-col gap-1">
          <strong>Mentions</strong>
          <PersonMultiSelect bind:value={_filter["#p"]} />
        </div>
        <div class="flex justify-end">
          <Anchor theme="button-accent" type="submit" on:click={applyFilter}>Apply Filters</Anchor>
        </div>
      </Content>
    </form>
  </Modal>
{/if}
