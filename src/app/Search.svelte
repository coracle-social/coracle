<script lang="ts">
  import cx from "classnames"
  import {identity, map} from "ramda"
  import {onMount, createEventDispatcher} from "svelte"
  import {fuzzy} from "src/util/misc"
  import Card from "src/partials/Card.svelte"
  import Modal from "src/partials/Modal.svelte"
  import Content from "src/partials/Content.svelte"
  import PersonSummary from "src/app/shared/PersonSummary.svelte"
  import {router} from "src/app/router"
  import type {Topic} from "src/engine"
  import {
    topics,
    peopleWithName,
    session,
  } from "src/engine"

  export let isOpen

  let searchInput
  let term = ""

  const dispatch = createEventDispatcher()

  const showSearch = () => {
    dispatch('click')
    searchInput.focus()
  }

  const hideSearch = () => {
    dispatch('close')
  }

  const openTopic = topic => {
    hideSearch()
    router.at("topic").of(topic).open()
  }

  const openPerson = pubkey => {
    hideSearch()
    router.at("people").of(pubkey).open()
  }

  const topicOptions = topics.derived(
    map((topic: Topic) => ({type: "topic", id: topic.name, topic, text: "#" + topic.name}))
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
          text:
            "@" +
            [profile?.name, profile?.display_name, handle?.address].filter(identity).join(" "),
        }
      })
  )

  onMount(() => {
    document.querySelector("html").addEventListener("click", e => {
      if (!(e.target as any).closest(".search-input")) {
        term = null
      }
    })
  })

  $: firstChar = term ? term.slice(0, 1) : null

  $: options = firstChar === "#" ? $topicOptions : $profileOptions

  $: search = fuzzy(options as any, {keys: ["text"], threshold: 0.5})
</script>


<svelte:body
  on:keydown={e => {
    if (e.key === "Escape" && isOpen) {
      hideSearch()
    }
  }} />

{#if term}
  <Modal onEscape={hideSearch}>
    <Content>
      {#each search(term).slice(0, 50) as result (result.type + result.id)}
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
  </Modal>
{/if}
