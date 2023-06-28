<script lang="ts">
  import {switcher, switcherFn} from "hurdak/lib/hurdak"
  import {displayPerson, displayRelay, Tags} from "src/util/nostr"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Rating from "src/partials/Rating.svelte"
  import {getPersonWithFallback} from "src/agent/db"

  export let note, rating

  const [type, value] = Tags.from(note)
    .reject(t => ["l", "L"].includes(t[0]))
    .first()

  const action = switcher(type, {
    r: () => modal.push({type: "relay/detail", url: value}),
    p: () => modal.push({type: "person/feed", pubkey: value}),
    e: () => modal.push({type: "note/detail", note: {id: value}}),
  })

  const display = switcherFn(type, {
    r: () => displayRelay({url: value}),
    p: () => displayPerson(getPersonWithFallback(value)),
    e: () => "a note",
    default: "something",
  })
</script>

<div class="mb-4 flex items-center gap-2 border-l-2 border-solid border-gray-5 pl-2">
  Rated
  {#if action}
    <Anchor class="underline" on:click={action}>{display}</Anchor>
  {:else}
    {display}
  {/if}
  <div class="text-sm">
    <Rating inert value={rating} />
  </div>
</div>
