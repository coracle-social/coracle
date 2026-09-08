<script lang="ts">
  import {isRelayUrl, displayRelayUrl, matchTag, tagSpec} from "@welshman/util"
  import {isHex32} from "@welshman/lib"
  import Link from "src/partials/Link.svelte"
  import Rating from "src/partials/Rating.svelte"
  import {getWriteRelays, profiles} from "src/engine/core"
  import {router} from "src/app/util/router"

  export let note, rating

  const tag = matchTag(tagSpec(["r", "p", "e"]), note.tags)

  let href = null
  let display = null

  // Build the link for the tag we actually have — router encoders throw on values that
  // don't match their type, and only link values we know are well formed, since these
  // events come from the network.
  if (tag) {
    const [type, value] = tag
    const relays = getWriteRelays(note.pubkey)

    if (type === "r") {
      display = displayRelayUrl(value)
      href = isRelayUrl(value) ? router.at("relays").of(value).toString() : null
    } else if (type === "p" && isHex32(value)) {
      display = profiles.get().display(value).get()
      href = router.at("people").of(value, {relays}).toString()
    } else if (type === "e" && isHex32(value)) {
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
