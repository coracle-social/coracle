<script lang="ts">
  import {isRelayUrl, displayRelayUrl, matchTag, tagSpec} from "@welshman/util"
  import {isHex} from "src/util/nostr"
  import Link from "src/partials/Link.svelte"
  import Rating from "src/partials/Rating.svelte"
  import {profiles, relayLists} from "src/engine/core"
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
    // Router.Event was the note author's write relays; full relay selection is asynchronous
    // now, and these are link parameters that have to be built in one pass.
    const relays = relayLists.get().writeUrls(note.pubkey).get()

    if (type === "r") {
      display = displayRelayUrl(value)
      href = isRelayUrl(value) ? router.at("relays").of(value).toString() : null
    } else if (type === "p" && isHex(value)) {
      display = profiles.get().display(value).get()
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
