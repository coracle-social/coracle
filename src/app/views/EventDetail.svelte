<script lang="ts">
  import {onMount} from "svelte"
  import {getIdOrAddress, getIdFilters} from "@welshman/util"
  import {feedFromFilter} from "@welshman/feeds"
  import {fly} from "src/util/transition"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import EventDate from "src/app/shared/EventDate.svelte"
  import EventInfo from "src/app/shared/EventInfo.svelte"
  import NoteCreateInline from "src/app/shared/NoteCreateInline.svelte"
  import {loadOne, deriveEvent} from "src/engine"
  import {makeFeed} from "src/domain"

  export let address
  export let relays = []

  const event = deriveEvent(address)

  const feed = makeFeed({definition: feedFromFilter({"#a": [address]})})

  let loading = true

  onMount(async () => {
    await loadOne({relays, filters: getIdFilters([address]), forcePlatform: false})

    loading = false
  })
</script>

{#if loading}
  <Spinner />
{:else if $event}
  <div in:fly={{y: 20}}>
    <FlexColumn>
      <div class="flex gap-4">
        <EventDate event={$event} />
        <EventInfo event={$event} />
      </div>
      <NoteCreateInline parent={$event} />
      <Feed {feed} hideSpinner shouldListen anchor={getIdOrAddress($event)} />
    </FlexColumn>
  </div>
{:else}
  <p class="text-center">Failed to find this event.</p>
{/if}
