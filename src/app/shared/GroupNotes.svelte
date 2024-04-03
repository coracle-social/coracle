<script lang="ts">
  import {without} from 'ramda'
  import {decodeAddress, isGroupAddress} from '@coracle.social/util'
  import {noteKinds} from 'src/util/nostr'
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import NoteCreateInline from "src/app/shared/NoteCreateInline.svelte"
  import {canSign} from 'src/engine'

  export let address
</script>

<FlexColumn large>
  {#if $canSign}
    <NoteCreateInline group={address} />
  {/if}
  <Feed
    eager
    shouldListen
    hideControls
    skipNetwork={isGroupAddress(decodeAddress(address))}
    filter={{kinds: without([30402], noteKinds), "#a": [address]}} />
</FlexColumn>
