<script lang="ts">
  import {switcher, switcherFn} from "hurdak"
  import {Tags} from "src/util/nostr"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Rating from "src/partials/Rating.svelte"
  import {displayRelay, displayPubkey} from "src/engine"

  export let note, rating

  const tag =
    Tags.from(note)
      .reject(t => ["l", "L"].includes(t[0]))
      .first() || []

  let action
  let display

  if (tag) {
    const [type, value] = tag

    action = switcher(type, {
      r: () => modal.push({type: "relay/detail", url: value}),
      p: () => modal.push({type: "person/detail", pubkey: value}),
      e: () => modal.push({type: "note/detail", note: {id: value}}),
    })

    display = switcherFn(type, {
      r: () => displayRelay({url: value}),
      p: () => displayPubkey(value),
      e: () => "a note",
      default: () => "something",
    })
  }
</script>

{#if tag}
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
{/if}
