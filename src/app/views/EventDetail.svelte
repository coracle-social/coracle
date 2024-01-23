<script lang="ts">
  import {onMount} from "svelte"
  import {defer} from "hurdak"
  import {Tags} from "paravel"
  import {Naddr, getIdOrAddress, noteKinds} from "src/util/nostr"
  import {fly} from "src/util/transition"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import EventDate from "src/app/shared/EventDate.svelte"
  import EventInfo from "src/app/shared/EventInfo.svelte"
  import NoteCreateInline from "src/app/shared/NoteCreateInline.svelte"
  import type {Event} from "src/engine"
  import {dereferenceNote, getGroupReqInfo} from "src/engine"

  export let address

  let event
  let promise: Promise<Event> = defer()

  onMount(() => {
    promise = dereferenceNote(Naddr.fromTagValue(address))
    promise.then(e => {
      event = e
    })
  })
</script>

{#await promise}
  <Spinner />
{:then event}
  {@const groupAddr = Tags.from(event).circles().first()}
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
        relays={groupAddr ? getGroupReqInfo(groupAddr).relays : []}
        filter={{kinds: noteKinds, "#a": [address]}} />
    </FlexColumn>
  </div>
{/await}
