<script lang="ts">
  import type {DynamicFilter} from "src/util/types"
  import {pluck, objOf} from "ramda"
  import {debounce} from "throttle-debounce"
  import {createLocalDate} from "src/util/misc"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Content from "src/partials/Content.svelte"
  import SelectButton from "src/partials/SelectButton.svelte"
  import MultiSelect from "src/partials/MultiSelect.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {searchTopics, searchPeople, getPersonWithFallback} from "src/agent/db"
  import {getUserFollows} from "src/agent/social"

  export let filter
  export let onChange

  const applyFilter = () => {
    const newFilter = {} as DynamicFilter

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
      newFilter.authors = _filter.authors.length > 0 ? pluck("pubkey", _filter.authors) : "global"
    } else {
      newFilter.authors = _filter.authors
    }

    onChange(newFilter)
  }

  const applySearch = debounce(200, applyFilter)

  const clearSearch = () => {
    _filter.search = ""
    applyFilter()
  }

  const onScopeChange = scope => {
    _filter = {..._filter, authors: scope === "custom" ? [] : scope}
  }

  const open = () => {
    modal = "maxi"
  }

  const onEscape = () => {
    modal = null
  }

  const submit = () => {
    console.log("====")
    onEscape()
    applyFilter()
  }

  let modal = null
  let scopeOptions = []
  let _filter = {
    since: filter.since,
    until: filter.since,
    search: filter.search || "",
    authors: Array.isArray(filter.authors)
      ? filter.authors.map(getPersonWithFallback)
      : filter.authors || "network",
    "#t": (filter["#t"] || []).map(objOf("name")),
    "#p": (filter["#p"] || []).map(getPersonWithFallback),
  }

  $: {
    scopeOptions =
      getUserFollows().length > 0
        ? ["follows", "network", "global", "custom"]
        : ["network", "global", "custom"]
  }
</script>

<div class="flex justify-end gap-1">
  <i
    class="fa fa-search cursor-pointer p-2"
    on:click={() => {
      modal = modal ? null : "mini"
    }} />
  <i class="fa fa-sliders cursor-pointer p-2" on:click={open} />
  <slot name="controls" />
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
            <strong>Authors</strong>
            <SelectButton
              onChange={onScopeChange}
              value={typeof _filter.authors === "string" ? _filter.authors : "custom"}
              options={scopeOptions} />
            {#if Array.isArray(_filter.authors)}
              <MultiSelect search={$searchPeople} bind:value={_filter.authors}>
                <div slot="item" let:item>
                  <div class="-my-1">
                    <PersonBadge inert person={getPersonWithFallback(item.pubkey)} />
                  </div>
                </div>
              </MultiSelect>
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
    </form>
  </Modal>
{/if}
