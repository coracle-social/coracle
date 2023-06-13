<script lang="ts">
  import type {Filter} from "nostr-tools"
  import {pluck} from "ramda"
  import {fly} from "svelte/transition"
  import {debounce} from "throttle-debounce"
  import {createLocalDate} from "src/util/misc"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Content from "src/partials/Content.svelte"
  import MultiSelect from "src/partials/MultiSelect.svelte"
  import PersonBadge from "src/app/shared/PersonBadge.svelte"
  import {searchTopics, searchPeople, getPersonWithFallback} from "src/agent/db"

  export let hide = []
  export let onChange

  let filter = {
    since: null,
    until: null,
    authors: [],
    search: "",
    "#t": [],
    "#p": [],
  }

  let modal = null

  const applyFilter = debounce(300, () => {
    if (modal !== "maxi") {
      const _filter = {} as Filter

      if (filter.since) _filter.since = createLocalDate(filter.since).setHours(23, 59, 59, 0) / 1000
      if (filter.until) _filter.until = createLocalDate(filter.until).setHours(23, 59, 59, 0) / 1000
      if (filter.authors.length > 0) _filter.authors = pluck("pubkey", filter.authors)
      if (filter.search) _filter.search = filter.search
      if (filter["#t"].length > 0) _filter["#t"] = pluck("name", filter["#t"])
      if (filter["#p"].length > 0) _filter["#p"] = pluck("pubkey", filter["#p"])

      onChange(_filter)
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

<div class="flex justify-end gap-2 p-2" in:fly={{y: 20}}>
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
        <Input bind:value={filter.search} on:input={applyFilter}>
          <i slot="before" class="fa fa-search" />
        </Input>
      </div>
      {#if modal === "maxi"}
        <div class="grid grid-cols-2 gap-2">
          <div class="flex flex-col gap-1">
            <strong>Since</strong>
            <Input type="date" bind:value={filter.since} />
          </div>
          <div class="flex flex-col gap-1">
            <strong>Until</strong>
            <Input type="date" bind:value={filter.until} />
          </div>
        </div>
        {#if !hide.includes("authors")}
          <div class="flex flex-col gap-1">
            <strong>Authors</strong>
            <MultiSelect search={$searchPeople} bind:value={filter.authors}>
              <div slot="item" let:item>
                <div class="-my-1">
                  <PersonBadge inert person={getPersonWithFallback(item.pubkey)} />
                </div>
              </div>
            </MultiSelect>
          </div>
        {/if}
        {#if !hide.includes("#t")}
          <div class="flex flex-col gap-1">
            <strong>Topics</strong>
            <MultiSelect search={$searchTopics} bind:value={filter["#t"]}>
              <div slot="item" let:item>
                <div class="-my-1">
                  #{item.name}
                </div>
              </div>
            </MultiSelect>
          </div>
        {/if}
        {#if !hide.includes("#p")}
          <div class="flex flex-col gap-1">
            <strong>Mentions</strong>
            <MultiSelect search={$searchPeople} bind:value={filter["#p"]}>
              <div slot="item" let:item>
                <div class="-my-1">
                  <PersonBadge inert person={getPersonWithFallback(item.pubkey)} />
                </div>
              </div>
            </MultiSelect>
          </div>
        {/if}
        <div class="flex justify-end">
          <Anchor type="button-accent" on:click={submit}>Apply Filters</Anchor>
        </div>
      {/if}
    </Content>
  </Modal>
{/if}
