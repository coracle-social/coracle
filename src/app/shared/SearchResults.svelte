<script lang="ts">
  import Fuse from "fuse.js"
  import {tryFunc} from "hurdak"
  import {fromNostrURI} from "paravel"
  import {throttle} from "throttle-debounce"
  import {nip05, nip19} from "nostr-tools"
  import {isHex} from "src/util/nostr"
  import {router} from "src/app/router"
  import type {Person, Topic} from "src/engine"
  import {pubkey, topics, derived, primeWotCaches, searchPeople, loadPeople} from "src/engine"

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
      entity = fromNostrURI(entity)

      if (entity.length < 5) {
        return
      }

      if (isHex(entity)) {
        router.at("people").of(entity).replaceModal()
      } else if (entity.includes("@")) {
        const profile = await nip05.queryProfile(entity)

        if (profile) {
          const {pubkey, relays} = profile

          router.at("people").of(pubkey, {relays}).replaceModal()
        }
      } else {
        tryFunc(() => {
          nip19.decode(entity)
          router.at(entity).replaceModal()
        })
      }
    },
    {
      noTrailing: true,
    },
  )

  const searchTopics = topics
    .throttle(1000)
    .derived($topics => new Fuse($topics, {keys: ["name"], threshold: 0.5, shouldSort: true}))

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

  $: loadPeople($term)

  primeWotCaches($pubkey)
</script>

{#each $results.slice(0, 30) as result (result.type + result.id)}
  <div on:click={() => onClick(result)}>
    <slot name="result" {result} />
  </div>
{:else}
  <p class="text-center py-12">No results found.</p>
{/each}
