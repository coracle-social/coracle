<script lang="ts">
  import {page} from "$app/stores"
  import {sortBy, last} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {formatTimestampAsDate} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import EventItem from "@app/components/EventItem.svelte"
  import EventCreate from "@app/components/EventCreate.svelte"
  import {pushModal} from "@app/modal"
  import {eventsByUrl, decodeNRelay} from "@app/state"

  const url = decodeNRelay($page.params.nrelay)

  const createEvent = () => pushModal(EventCreate, {url})

  const getStart = (event: TrustedEvent) =>
    parseInt(event.tags.find(t => t[0] === "start")?.[1] || "0")

  let loading = true

  type Item = {
    event: TrustedEvent
    dateDisplay?: string
  }

  $: items = sortBy(getStart, $eventsByUrl.get(url) || []).reduce<Item[]>((r, event) => {
    const prevDateDisplay =
      r.length > 0 ? formatTimestampAsDate(getStart(last(r).event)) : undefined
    const newDateDisplay = formatTimestampAsDate(getStart(event))
    const dateDisplay = prevDateDisplay === newDateDisplay ? undefined : newDateDisplay

    return [...r, {event, dateDisplay}]
  }, [])

  setTimeout(() => {
    loading = false
  }, 3000)
</script>

<div class="relative flex h-screen flex-col">
  <PageBar>
    <div slot="icon" class="center">
      <Icon icon="calendar-minimalistic" />
    </div>
    <strong slot="title">Calendar</strong>
  </PageBar>
  <div class="flex flex-grow flex-col gap-2 overflow-auto p-2">
    {#each items as { event, dateDisplay }, i (event.id)}
      {#if dateDisplay}
        <Divider>{dateDisplay}</Divider>
      {/if}
      <EventItem {event} />
    {/each}
    <p class="flex h-10 items-center justify-center py-20">
      <Spinner {loading}>
        {#if loading}
          Looking for events...
        {:else if items.length === 0}
          No events found.
        {/if}
      </Spinner>
    </p>
  </div>
  <Button
    class="tooltip tooltip-left fixed bottom-16 sm:bottom-4 right-2 sm:right-4 p-1 z-feature"
    data-tip="Create an Event"
    on:click={createEvent}>
    <div class="btn btn-circle btn-primary flex h-12 w-12 items-center justify-center">
      <Icon icon="calendar-add" />
    </div>
  </Button>
</div>
