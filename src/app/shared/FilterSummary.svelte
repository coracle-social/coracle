<script lang="ts">
  import {formatTimestampAsDate} from "src/util/misc"
  import {displayPerson} from "src/util/nostr"
  import Chip from "src/partials/Chip.svelte"
  import {getPersonWithFallback} from "src/agent/db"

  export let filter

  const displayPeople = pubkeys =>
    pubkeys.length === 1
      ? displayPerson(getPersonWithFallback(pubkeys[0]))
      : `${pubkeys.length} people`

  const displayTopics = topics => (topics.length === 1 ? topics[0] : `${topics.length} topics`)

  const getFilterParts = f => {
    const parts = []

    if (typeof filter.authors === "string") {
      parts.push(`From ${filter.authors}`)
    } else if (filter.authors?.length > 0) {
      parts.push(`By ${displayPeople(filter.authors)}`)
    }

    if (filter["#p"]?.length > 0) {
      parts.push(`Mentioning ${displayPeople(filter["#p"])}`)
    }

    if (filter["#t"]?.length > 0) {
      parts.push(`Related to ${displayTopics(filter["#t"])}`)
    }

    if (filter.search) {
      parts.push(`Matching ${filter.search}`)
    }

    if (filter.since && filter.until) {
      const since = formatTimestampAsDate(filter.since)
      const until = formatTimestampAsDate(filter.until)

      parts.push(`Between ${since} and ${until}`)
    } else if (filter.since) {
      parts.push(`After ${formatTimestampAsDate(filter.since)}`)
    } else if (filter.until) {
      parts.push(`Before ${formatTimestampAsDate(filter.until)}`)
    }

    return parts
  }

  $: parts = getFilterParts(filter)
</script>

<div>
  {#if parts.length > 0}
    <span class="mr-2 mb-2"> Showing notes: </span>
  {/if}
  {#each parts as part}
    <Chip class="mr-2 mb-2">{part}</Chip>
  {/each}
</div>
