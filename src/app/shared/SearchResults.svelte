<script lang="ts">
  import {throttle} from "throttle-debounce"
  import {fuzzy} from "src/util/misc"
  import {parseAnything} from "src/util/nostr"
  import {router} from "src/app/router"
  import type {Person, Topic} from "src/engine"
  import {topics, derived, searchPeople, loadPeople} from "src/engine"

  export let term
  export let replace = false

  const openTopic = topic => router.at("topics").of(topic).open({replace})

  const openPerson = pubkey => router.at("people").of(pubkey).open({replace})

  const onClick = result => {
    if (result.type === "topic") {
      openTopic(result.topic.name)
    }

    if (result.type === "profile") {
      openPerson(result.id)
    }
  }

  const tryParseEntity = throttle(
    500,
    async entity => {
      const result = await parseAnything(entity)

      if (result.type === "npub") {
        router.at("people").of(result.data).open()
      } else if (result) {
        router.at(entity).open()
      }
    },
    {
      noTrailing: true,
    },
  )

  const searchTopics = topics
    .throttle(1000)
    .derived($topics => fuzzy($topics, {keys: ["name"], threshold: 0.5, shouldSort: true}))

  const results = derived<{type: string; id: string; person?: Person; topic?: Topic}[]>(
    [term, searchTopics, searchPeople],
    ([$term, $searchTopics, $searchPeople]) => {
      $term = $term || ""

      if ($term.length > 30) {
        tryParseEntity($term)
      }

      return $term.startsWith("#")
        ? $searchTopics($term.slice(1)).map(topic => ({type: "topic", id: topic.name, topic}))
        : $searchPeople($term).map(person => ({type: "profile", id: person.pubkey, person}))
    },
  )

  $: {
    if ($term) {
      loadPeople($term)
    }
  }
</script>

{#each $results.slice(0, 30) as result (result.type + result.id)}
  <div on:click={() => onClick(result)}>
    <slot name="result" {result} />
  </div>
{:else}
  <p class="text-center py-12">No results found.</p>
{/each}
