<script>
  import {debounce} from "throttle-debounce"
  import {identity, sortBy, prop} from "ramda"
  import {fuzzy} from "src/util/misc"
  import {modal} from "src/partials/state"
  import Input from "src/partials/Input.svelte"
  import Heading from "src/partials/Heading.svelte"
  import Content from "src/partials/Content.svelte"
  import BorderLeft from "src/partials/BorderLeft.svelte"
  import PersonInfo from "src/app/shared/PersonInfo.svelte"
  import {sampleRelays} from "src/agent/relays"
  import network from "src/agent/network"
  import {watch} from "src/agent/db"
  import user from "src/agent/user"

  let q

  const openTopic = topic => {
    modal.push({type: "topic/feed", topic})
  }

  const loadPeople = debounce(500, search => {
    if (q.length > 2) {
      network.load({
        relays: sampleRelays([{url: "wss://relay.nostr.band"}]),
        filter: [{kinds: [0], search, limit: 10}],
      })
    }
  })

  $: loadPeople(q)

  $: search = watch(["people", "topics"], (p, t) => {
    const topics = t
      .all()
      .map(topic => ({type: "topic", id: topic.name, topic, text: "#" + topic.name}))

    const people = p
      .all({"kind0.name": {$type: "string"}, pubkey: {$ne: user.getPubkey()}})
      .map(person => ({
        person,
        type: "person",
        id: person.pubkey,
        text: "@" + [person.kind0.name, person.kind0.about].filter(identity).join(" "),
      }))

    return fuzzy(sortBy(prop("id"), topics.concat(people)), {keys: ["text"]})
  })

  document.title = "Search"
</script>

<Content>
  <div class="flex flex-col items-center justify-center">
    <Heading>Search</Heading>
    <p>
      Search for people and topics on Nostr. For now, only results that have already been loaded
      will appear in search results.
    </p>
  </div>
  <Input bind:value={q} placeholder="Search for people or topics">
    <i slot="before" class="fa-solid fa-search" />
  </Input>
  {#each $search(q).slice(0, 50) as result (result.type + result.id)}
    {#if result.type === "topic"}
      <BorderLeft on:click={() => openTopic(result.topic.name)}>
        #{result.topic.name}
      </BorderLeft>
    {:else if result.type === "person"}
      <PersonInfo person={result.person} />
    {/if}
  {/each}
</Content>
