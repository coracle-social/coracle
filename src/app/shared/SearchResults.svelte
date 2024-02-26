<script lang="ts">
  import {throttle} from "throttle-debounce"
  import {slide} from "src/util/transition"
  import {fuzzy} from "src/util/misc"
  import {parseAnything} from "src/util/nostr"
  import {router} from "src/app/router"
  import type {Person, Topic} from "src/engine"
  import {topics, derived, searchPeople, createPeopleLoader} from "src/engine"

  export let term
  export let replace = false
  export let showLoading = false

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

      if (result?.type === "npub") {
        setTimeout(() => router.at("people").of(result.data).open(), 30)
      } else if (result) {
        setTimeout(() => router.at(entity).open(), 30)
      }
    },
    {
      noTrailing: true,
    },
  )

  const {loading: loadingPeople, load: loadPeople} = createPeopleLoader()

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

  // Suppress the dialog for a moment if we're pasting an entity in since we'll immediately redirect
  let visible = false

  $: {
    if ($term) {
      loadPeople($term)

      setTimeout(() => {
        visible = true
      }, 100)
    } else {
      visible = false
    }
  }
</script>

{#if visible}
  {#each $results.slice(0, 30) as result (result.type + result.id)}
    <div on:click={() => onClick(result)}>
      <slot name="result" {result} />
    </div>
  {:else}
    <p class="text-center py-12">No results found.</p>
  {/each}
  {#if showLoading && $loadingPeople}
    <div
      transition:slide|local
      class="absolute bottom-0 left-0 right-0 flex gap-2 bg-tinted-700 px-4 py-2 text-neutral-200">
      <div>
        <i class="fa fa-circle-notch fa-spin" />
      </div>
      Loading more options...
    </div>
  {/if}
{/if}
