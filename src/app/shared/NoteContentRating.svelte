<script lang="ts">
  import {switcherFn} from "hurdak"
  import {Tags} from "src/util/nostr"
  import Anchor from "src/partials/Anchor.svelte"
  import Rating from "src/partials/Rating.svelte"
  import {router} from "src/app/router"
  import {displayRelay, displayPubkey} from "src/engine"

  export let note, rating

  const tag =
    Tags.from(note)
      .reject(t => ["l", "L"].includes(t[0]))
      .first() || []

  let href
  let display

  if (tag) {
    const [type, value] = tag

    href = switcherFn(type, {
      r: () => router.at("relays").of(value).toString(),
      p: () => router.at("people").of(value).toString(),
      e: () => router.at("notes").of(value).toString(),
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
    {#if href}
      <Anchor modal class="underline" {href}>{display}</Anchor>
    {:else}
      {display}
    {/if}
    <div class="text-sm">
      <Rating inert value={rating} />
    </div>
  </div>
{/if}
