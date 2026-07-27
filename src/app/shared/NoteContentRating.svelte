<script lang="ts">
  import {getTag, isRelayUrl, displayRelayUrl} from "@welshman/util"
  import {Router} from "@welshman/router"
  import {displayProfileByPubkey} from "@welshman/app"
  import {isHex} from "src/util/nostr"
  import Link from "src/partials/Link.svelte"
  import Rating from "src/partials/Rating.svelte"
  import {router} from "src/app/util/router"

  export let note, rating

  const tag = getTag(["r", "p", "e"], note.tags)

  let href = null
  let display = null

  // Build the link for the tag we actually have — router encoders throw on values that
  // don't match their type, and only link values we know are well formed, since these
  // events come from the network.
  if (tag) {
    const [type, value] = tag
    const relays = Router.get().Event(note).getUrls()

    if (type === "r") {
      display = displayRelayUrl(value)
      href = isRelayUrl(value) ? router.at("relays").of(value).toString() : null
    } else if (type === "p" && isHex(value)) {
      display = displayProfileByPubkey(value)
      href = router.at("people").of(value, {relays}).toString()
    } else if (type === "e" && isHex(value)) {
      display = "a note"
      href = router.at("notes").of(value, {relays}).toString()
    }
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
