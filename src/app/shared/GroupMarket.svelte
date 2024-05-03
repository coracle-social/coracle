<script lang="ts">
  import {feedFromFilter} from "@welshman/feeds"
  import Card from "src/partials/Card.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {router} from "src/app/util/router"

  export let address

  const createListing = () => router.at("notes/create").qp({type: "listing", group: address}).open()
</script>

<Card class="flex justify-between">
  Have something you'd like to sell on nostr?
  <Anchor button accent on:click={createListing}>Create a listing</Anchor>
</Card>

<Feed feed={feedFromFilter({kinds: [30402], "#a": [address]})} />
