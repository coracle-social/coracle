<script lang="ts">
  import Card from "src/partials/Card.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {router} from "src/app/router"

  export let group
  export let relays

  const createListing = () => router.at("notes/create").qp({type: "listing", group}).open()
</script>

<Card class="flex justify-between">
  Have something you'd like to sell on nostr?
  <Anchor button accent on:click={createListing}>Create a listing</Anchor>
</Card>

<Feed hideControls {relays} filter={{kinds: [30402], "#a": [group]}} />
