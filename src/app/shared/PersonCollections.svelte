<script lang="ts">
  import {batch} from "hurdak"
  import {Tags} from "@coracle.social/util"
  import Chip from "src/partials/Chip.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import Note from "src/app/shared/Note.svelte"
  import {load, hints} from "src/engine"

  export let pubkey

  const setTopic = t => {
    topic = t
  }

  let topic
  let events = []
  let collections = {}

  $: {
    collections = {}

    for (const e of events) {
      const tags = Tags.fromEvent(e)
      const topic = tags.whereKey("l").whereMark("#t").values().first()

      if (!topic) {
        continue
      }

      collections[topic] = collections[topic] || {ids: []}
      collections[topic].updated_at = Math.max(collections[topic].updated_at || 0, e.created_at)

      for (const id of tags.values("e").valueOf()) {
        collections[topic].ids.push(id)
      }
    }
  }

  load({
    relays: hints.FromPubkeys([pubkey]).getUrls(),
    filters: [{kinds: [1985], authors: [pubkey], "#L": ["#t"]}],
    onEvent: batch(300, chunk => {
      events = [...events, ...chunk]
    }),
  })
</script>

<div class="flex gap-2">
  <div class="my-1">Select a collection:</div>
  <div class="-mb-2">
    {#each Object.keys(collections) as topic (topic)}
      <Chip class="mb-2 mr-2 inline-block cursor-pointer" on:click={() => setTopic(topic)}
        >{topic}</Chip>
    {/each}
  </div>
</div>

{#if topic}
  <Subheading>#{topic}</Subheading>
  {#each collections[topic].ids as id (id)}
    <Note note={{id}} />
  {/each}
{/if}
