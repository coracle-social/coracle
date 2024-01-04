<script lang="ts">
  import Card from 'src/partials/Card.svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import Feed from 'src/app/shared/Feed.svelte'
  import type {DynamicFilter} from 'src/engine'
  import {env, canSign, pubkey, follows, getPubkeysWithDefaults} from 'src/engine'
  import {router} from 'src/app/router'

  const filter: DynamicFilter = {kinds: [30402]}

  if ($env.FORCE_GROUP) {
    filter['#a'] = [$env.FORCE_GROUP]
  } else {
    filter.authors = getPubkeysWithDefaults($follows).concat($pubkey)
  }

  const createListing = () =>
    router.at('notes/create').qp({type: 'listing'}).open()
</script>

{#if $canSign}
  <Card class="flex justify-between">
    Have something you'd like to sell on nostr?
    <Anchor button accent on:click={createListing}>Create a listing</Anchor>
  </Card>
{/if}

<Feed hideControls={$env.FORCE_GROUP} {filter} />
