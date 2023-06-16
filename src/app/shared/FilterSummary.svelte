<script lang="ts">
  import {omit} from "ramda"
  import {formatTimestampAsDate} from "src/util/misc"
  import {displayPerson} from "src/util/nostr"
  import Chip from "src/partials/Chip.svelte"
  import {getPersonWithFallback} from "src/agent/db"

  export let filter
  export let onChange

  const displayPeople = pubkeys =>
    pubkeys.length === 1
      ? displayPerson(getPersonWithFallback(pubkeys[0]))
      : `${pubkeys.length} people`

  const displayTopics = topics => (topics.length === 1 ? topics[0] : `${topics.length} topics`)

  const getFilterParts = f => {
    const parts = []

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
    onChange(omit(keys, filter))
  }

  $: parts = getFilterParts(filter)
</script>

<div class="flex-grow">
  {#if parts.length > 0}
    <div class="mr-2 mb-2 inline-block py-1">Showing notes:</div>
  {/if}
  {#each parts as { keys, label }}
    <Chip class="mr-2 mb-2" onClick={keys ? () => removePart(keys) : null}>{label}</Chip>
  {/each}
</div>
