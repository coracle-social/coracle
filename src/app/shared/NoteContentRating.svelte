<script lang="ts">
  import {switcherFn} from "hurdak"
  import {Tags} from "paravel"
  import Anchor from "src/partials/Anchor.svelte"
  import Rating from "src/partials/Rating.svelte"
  import {router} from "src/app/router"
  import {displayRelay, displayPubkey, getEventHints} from "src/engine"

  export let note, rating

  const tag = Tags.from(note).type(["r", "p", "e"]).first()

  let href
  let display

  if (tag) {
    const [type, value] = tag
    const relays = getEventHints(note)

    href = switcherFn(type, {
      r: () => router.at("relays").of(value).toString(),
      p: () => router.at("people").of(value, {relays}).toString(),
      e: () => router.at("notes").of(value, {relays}).toString(),
      default: () => null,
    })

    display = switcherFn(type, {
      r: () => displayRelay({url: value}),
      p: () => displayPubkey(value),
      e: () => "a note",
      default: () => null,
    })
  }
</script>

{#if display}
  <div class="mb-4 flex items-center gap-2 border-l-2 border-solid border-mid pl-2">
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
