<script lang="ts">
  import type {Filter} from "nostr-tools"
  import {pluck, objOf} from "ramda"
  import {debounce} from "throttle-debounce"
  import {createLocalDate} from "src/util/misc"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Content from "src/partials/Content.svelte"
  import MultiSelect from "src/partials/MultiSelect.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {searchTopics, searchPeople, getPersonWithFallback} from "src/agent/db"

  export let onChange
  export let filter = {} as Filter

  let _filter = {
    since: filter.since,
    until: filter.since,
    search: filter.search || "",
    authors: (filter.authors || []).map(getPersonWithFallback),
    "#t": (filter["#t"] || []).map(objOf("name")),
    "#p": (filter["#p"] || []).map(getPersonWithFallback),
  }

  let modal = null

  const applyFilter = debounce(300, () => {
    if (modal !== "maxi") {
      const newFilter = {} as Filter

      if (_filter.since)
        newFilter.since = createLocalDate(_filter.since).setHours(23, 59, 59, 0) / 1000
      if (_filter.until)
        newFilter.until = createLocalDate(_filter.until).setHours(23, 59, 59, 0) / 1000
      if (_filter.authors.length > 0) newFilter.authors = pluck("pubkey", _filter.authors)
      if (_filter.search) newFilter.search = _filter.search
      if (_filter["#t"].length > 0) newFilter["#t"] = pluck("name", _filter["#t"])
      if (_filter["#p"].length > 0) newFilter["#p"] = pluck("pubkey", _filter["#p"])

      onChange(newFilter)
    }
  })

  const open = () => {
    modal = "maxi"
  }

  const submit = () => {
    applyFilter()
    onEscape()
  }

  const onEscape = () => {
    modal = null
  }
</script>

<div class="flex justify-end gap-2 p-2">
  <i
    class="fa fa-search cursor-pointer"
    on:click={() => {
      modal = modal ? null : "mini"
    }} />
  <i class="fa fa-sliders cursor-pointer" on:click={open} />
</div>

{#if modal}
  <Modal {onEscape} mini={modal === "mini"}>
    <Content size="lg">
      <div class="flex flex-col gap-1">
        <strong>Search</strong>
        <Input bind:value={_filter.search} on:input={applyFilter}>
          <i slot="before" class="fa fa-search" />
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
          <strong>Authors</strong>
          <MultiSelect search={$searchPeople} bind:value={_filter.authors}>
            <div slot="item" let:item>
              <div class="-my-1">
                <PersonBadge inert person={getPersonWithFallback(item.pubkey)} />
              </div>
            </div>
          </MultiSelect>
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
          <MultiSelect search={$searchPeople} bind:value={_filter["#p"]}>
            <div slot="item" let:item>
              <div class="-my-1">
                <PersonBadge inert person={getPersonWithFallback(item.pubkey)} />
              </div>
            </div>
          </MultiSelect>
        </div>
        <div class="flex justify-end">
          <Anchor type="button-accent" on:click={submit}>Apply Filters</Anchor>
        </div>
      {/if}
    </Content>
  </Modal>
{/if}
