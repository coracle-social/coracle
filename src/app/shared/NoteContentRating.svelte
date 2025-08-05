<script lang="ts">
  import {switcher} from "@welshman/lib"
  import {getTag, displayRelayUrl} from "@welshman/util"
  import {Router} from "@welshman/router"
  import {displayProfileByPubkey} from "@welshman/app"
  import Link from "src/partials/Link.svelte"
  import Rating from "src/partials/Rating.svelte"
  import {router} from "src/app/util/router"

  export let note, rating

  const tag = getTag(["r", "p", "e"], note.tags)

  let href
  let display

  if (tag) {
    const [type, value] = tag
    const relays = Router.get().Event(note).getUrls()

    href = switcher(type, {
      r: router.at("relays").of(value).toString(),
      p: router.at("people").of(value, {relays}).toString(),
      e: router.at("notes").of(value, {relays}).toString(),
      default: null,
    })

    display = switcher(type, {
      r: displayRelayUrl(value),
      p: displayProfileByPubkey(value),
      e: "a note",
      default: null,
    })
  }
</script>

{#if display}
  <div class="mb-4 flex items-center gap-2 border-l-2 border-solid border-neutral-600 pl-2">
    Rated
    {#if href}
      <Link modal class="underline" {href}>{display}</Link>
    {:else}
      {display}
    {/if}
    <div class="text-sm">
      <Rating inert value={rating} />
    </div>
  </div>
{/if}
