<script lang="ts">
  import type {Writable} from "svelte/store"
  import {throttle} from "throttle-debounce"
  import {derived} from "svelte/store"
  import {topicSearch, profileSearch} from "@welshman/app"
  import {parseAnything} from "src/util/nostr"
  import {router} from "src/app/util/router"
  import {createPeopleLoader} from "src/engine"

  export let term: Writable<string>
  export let replace = false
  export let searching = null

  const openTopic = topic => router.at("topics").of(topic).open({replace})

  const openProfile = pubkey => router.at("people").of(pubkey).open({replace})

  const onClick = result => {
    if (result.type === "topic") {
      openTopic(result.id)
    }

    if (result.type === "profile") {
      openProfile(result.id)
    }
  }

  const tryParseEntity = throttle(
    500,
    async entity => {
      const result = await parseAnything(entity)

      if (result?.type === "npub") {
        term.set(null)
        router.clearModals()
        setTimeout(() => router.at("people").of(result.data).open(), 30)
      } else if (result) {
        term.set(null)
        router.clearModals()
        setTimeout(() => router.at(entity).open(), 30)
      }
    },
    {
      noTrailing: true,
    },
  )

  const {loading: loadingPeople, load: loadPeople} = createPeopleLoader()

  const results = derived(
    [term, topicSearch, profileSearch],
    ([$term, $topicSearch, $profileSearch]) => {
      $term = $term || ""

      if ($term.length > 30) {
        tryParseEntity($term)
      }

      return $term.startsWith("#")
        ? $topicSearch
            .searchOptions($term.slice(1))
            .map(topic => ({type: "topic", id: topic.name, topic}))
        : $profileSearch
            .searchOptions($term)
            .map(profile => ({type: "profile", id: profile.event.pubkey, profile}))
    },
  )

  // Suppress the dialog for a moment if we're pasting an entity in since we'll immediately redirect
  let visible = false

  $: searching = $loadingPeople

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
{/if}
