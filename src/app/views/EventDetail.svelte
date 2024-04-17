<script lang="ts">
  import {onMount} from "svelte"
  import {getIdOrAddress, decodeAddress} from "@coracle.social/util"
  import {filterFeed} from "@coracle.social/feeds"
  import {fly} from "src/util/transition"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import EventDate from "src/app/shared/EventDate.svelte"
  import EventInfo from "src/app/shared/EventInfo.svelte"
  import NoteCreateInline from "src/app/shared/NoteCreateInline.svelte"
  import {dereferenceNote} from "src/engine"

  export let address
  export let relays = []
  export let event = null

  let loading = true

  onMount(async () => {
    event = event || (await dereferenceNote(decodeAddress(address, relays)))
    loading = false
  })
</script>

{#if loading}
  <Spinner />
{:else if event}
  <div in:fly={{y: 20}}>
    <FlexColumn>
      <div class="flex gap-4">
        <EventDate {event} />
        <EventInfo {event} />
      </div>
      <NoteCreateInline parent={event} />
      <Feed
        hideSpinner
        hideControls
        shouldListen
        anchor={getIdOrAddress(event)}
        feed={filterFeed({"#a": [address]})} />
    </FlexColumn>
  </div>
{:else}
  <p class="text-center">Failed to find this event.</p>
{/if}
