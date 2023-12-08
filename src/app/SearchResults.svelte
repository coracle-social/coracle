<script lang="ts">
  import Fuse from "fuse.js"
  import {throttle} from "throttle-debounce"
  import {identity, sortBy, map} from "ramda"
  import Card from "src/partials/Card.svelte"
  import Content from "src/partials/Content.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import {router} from "src/app/router"
  import type {Topic} from "src/engine"
  import {
    pubkey,
    topics,
    peopleWithName,
    primeWotCaches,
    getWotScore,
    loadPeople,
    session,
  } from "src/engine"

  export let term
  export let onClose

  let results = []

  const openTopic = topic => {
    onClose()
    router.at("topic").of(topic).open()
  }

  const openPerson = pubkey => {
    onClose()
    router.at("people").of(pubkey).open()
  }

  const topicOptions = topics.derived(
    map((topic: Topic) => ({type: "topic", id: topic.name, topic, text: "#" + topic.name})),
  )

  const profileOptions = peopleWithName.derived($people =>
    $people
      .filter(person => person.pubkey !== $session?.pubkey)
      .map(person => {
        const {pubkey, profile, handle} = person

        return {
          person,
          id: pubkey,
          type: "profile",
          text: [profile?.name, profile?.display_name, handle?.address].filter(identity).join(" "),
        }
      }),
  )

  const search = s => {
    if (!s) {
      return sortBy(r => -getWotScore($pubkey, r.person.pubkey), $profileOptions) as any[]
    }

    return sortBy(({score, item}: any) => {
      if (item.type === "profile") {
        return (score - 1) * Math.sqrt(getWotScore($pubkey, item.person.pubkey))
      }

      return -score
    }, fuse.search(s)).map(r => r.item) as any[]
  }

  const populateResults = throttle(300, s => {
    results = search(s).slice(0, 50)
  })

  // Prime our wot cache
  if ($pubkey) {
    primeWotCaches($pubkey)
  }

  $: {
    if (term && !term.startsWith("#")) {
      loadPeople(term)
    }
  }

  $: firstChar = term ? term.slice(0, 1) : null

  $: options = firstChar === "#" ? $topicOptions : $profileOptions

  $: fuse = new Fuse(options as any, {
    keys: ["text"],
    threshold: 0.5,
    shouldSort: false,
    includeScore: true,
  })

  $: populateResults(term)
</script>

<Content gap="gap-3">
  {#each results as result (result.type + result.id)}
    {#if result.type === "topic"}
      <Card interactive on:click={() => openTopic(result.topic.name)}>
        #{result.topic.name}
      </Card>
    {:else if result.type === "profile"}
      <Card interactive on:click={() => openPerson(result.id)}>
        <PersonSummary inert hideActions pubkey={result.id} />
      </Card>
    {/if}
  {:else}
    <p class="text-center py-12">No results found.</p>
  {/each}
</Content>
