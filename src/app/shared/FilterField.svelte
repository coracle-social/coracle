<script context="module" lang="ts">
  import {LRUCache} from "@welshman/lib"
  import type {Filter} from "@welshman/util"

  // Keep track of filter part order, even when we re-render
  const sectionsByFilter = new LRUCache<Filter, string[]>(30)
</script>

<script lang="ts">
  import {omit, without} from "ramda"
  import Popover from "src/partials/Popover.svelte"
  import Menu from "src/partials/Menu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import FilterKindsField from "src/app/shared/FilterKindsField.svelte"
  import FilterSearchField from "src/app/shared/FilterSearchField.svelte"
  import FilterTopicsField from "src/app/shared/FilterTopicsField.svelte"
  import FilterAuthorsField from "src/app/shared/FilterAuthorsField.svelte"
  import FilterMentionsField from "src/app/shared/FilterMentionsField.svelte"
  import FilterTimeframeField from "src/app/shared/FilterTimeframeField.svelte"

  export let filter
  export let onChange
  export let onRemove

  const getSections = () => {
    const sections: string[] = []

    if (filter.kinds) sections.push("kinds")
    if (filter.search) sections.push("search")
    if (filter["#t"]) sections.push("topics")
    if (filter.authors || filter.scopes) sections.push("authors")
    if (filter["#p"]) sections.push("mentions")
    if (filter.since || filter.until || filter.since_ago || filter.until_ago) {
      sections.push("timeframe")
    }

    return sections
  }

  const removeSection = section => {
    sections = without([section], sections)

    if (section === "kinds") {
      filter = omit(["kinds"], filter)
    }

    if (section === "search") {
      filter = omit(["search"], filter)
    }

    if (section === "topics") {
      filter = omit(["#t"], filter)
    }

    if (section === "authors") {
      filter = omit(["authors", "scopes"], filter)
    }

    if (section === "mentions") {
      filter = omit(["#p"], filter)
    }

    if (section === "timeframe") {
      filter = omit(["since", "until", "since_ago", "until_ago"], filter)
    }

    onChange(filter)
  }

  const addSection = section => {
    sections = [...sections, section]
  }

  let sections: string[] = sectionsByFilter.get(filter) || getSections()

  $: sectionsByFilter.set(filter, sections)
</script>

<FlexColumn class="relative">
  {#each sections as section}
    <div class="relative">
      {#if section === "kinds"}
        <FilterKindsField {filter} {onChange} onRemove={() => removeSection("kinds")} />
      {:else if section === "search"}
        <FilterSearchField {filter} {onChange} onRemove={() => removeSection("search")} />
      {:else if section === "topics"}
        <FilterTopicsField {filter} {onChange} onRemove={() => removeSection("topics")} />
      {:else if section === "authors"}
        <FilterAuthorsField {filter} {onChange} onRemove={() => removeSection("authors")} />
      {:else if section === "mentions"}
        <FilterMentionsField {filter} {onChange} onRemove={() => removeSection("mentions")} />
      {:else if section === "timeframe"}
        <FilterTimeframeField {filter} {onChange} onRemove={() => removeSection("timeframe")} />
      {/if}
    </div>
  {/each}
  <div>
    <Popover theme="transparent" opts={{hideOnClick: true}} class="inline">
      <span slot="trigger" class="cursor-pointer">
        <i class="fa fa-plus" /> Add selection
      </span>
      <div slot="tooltip">
        <Menu>
          {#if !sections.includes("topics")}
            <MenuItem on:click={() => addSection("topics")}>Topics</MenuItem>
          {/if}
          {#if !sections.includes("authors")}
            <MenuItem on:click={() => addSection("authors")}>Authors</MenuItem>
          {/if}
          {#if !sections.includes("mentions")}
            <MenuItem on:click={() => addSection("mentions")}>Mentions</MenuItem>
          {/if}
          {#if !sections.includes("timeframe")}
            <MenuItem on:click={() => addSection("timeframe")}>Timeframe</MenuItem>
          {/if}
          {#if !sections.includes("search")}
            <MenuItem on:click={() => addSection("search")}>Search</MenuItem>
          {/if}
          {#if !sections.includes("kinds")}
            <MenuItem on:click={() => addSection("kinds")}>Kinds</MenuItem>
          {/if}
        </Menu>
      </div>
    </Popover>
  </div>
  <div
    class="absolute -right-4 -top-2 flex h-4 w-4 cursor-pointer items-center justify-center"
    on:click={onRemove}>
    <i class="fa fa-times fa-lg" />
  </div>
</FlexColumn>
