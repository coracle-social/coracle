<script lang="ts">
  import {onMount, onDestroy} from "svelte"
  import {page} from "$app/stores"
  import {sortBy, last, ago} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {EVENT_DATE, EVENT_TIME} from "@welshman/util"
  import {subscribe, formatTimestampAsDate} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import MenuSpaceButton from "@app/components/MenuSpaceButton.svelte"
  import EventItem from "@app/components/EventItem.svelte"
  import EventCreate from "@app/components/EventCreate.svelte"
  import {pushModal} from "@app/modal"
  import {deriveEventsForUrl, decodeRelay} from "@app/state"
  import {pullConservatively} from "@app/requests"
  import {setChecked} from "@app/notifications"

  const url = decodeRelay($page.params.relay)
  const kinds = [EVENT_DATE, EVENT_TIME]
  const events = deriveEventsForUrl(url, [{kinds}])

  const createEvent = () => pushModal(EventCreate, {url})

  const getEnd = (event: TrustedEvent) => parseInt(event.tags.find(t => t[0] === "end")?.[1] || "")

  const getStart = (event: TrustedEvent) =>
    parseInt(event.tags.find(t => t[0] === "start")?.[1] || "")

  const limit = 5
  let loading = $state(true)

  type Item = {
    event: TrustedEvent
    dateDisplay?: string
  }

  let items = $derived(
    sortBy(e => -getStart(e), $events)
      .reduce<Item[]>((r, event) => {
        const end = getEnd(event)
        const start = getStart(event)

        if (isNaN(start) || isNaN(end)) return r

        const prevDateDisplay =
          r.length > 0 ? formatTimestampAsDate(getStart(last(r).event)) : undefined
        const newDateDisplay = formatTimestampAsDate(start)
        const dateDisplay = prevDateDisplay === newDateDisplay ? undefined : newDateDisplay

        return [...r, {event, dateDisplay}]
      }, [])
      .slice(0, limit),
  )

  onMount(() => {
    const sub = subscribe({filters: [{kinds, since: ago(30)}]})

    pullConservatively({filters: [{kinds}], relays: [url]})

    return () => sub.close()
  })

  onDestroy(() => {
    setChecked($page.url.pathname)
  })

  setTimeout(() => {
    loading = false
  }, 5000)
</script>

<div class="relative flex h-screen flex-col">
  <PageBar>
    {#snippet icon()}
      <div class="center">
        <Icon icon="calendar-minimalistic" />
      </div>
    {/snippet}
    {#snippet title()}
      <strong>Calendar</strong>
    {/snippet}
    {#snippet action()}
      <div class="md:hidden">
        <MenuSpaceButton {url} />
      </div>
    {/snippet}
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
    class="tooltip tooltip-left fixed bottom-16 right-2 z-feature p-1 md:bottom-4 md:right-4"
    data-tip="Create an Event"
    on:click={createEvent}>
    <div class="btn btn-circle btn-primary flex h-12 w-12 items-center justify-center">
      <Icon icon="calendar-add" />
    </div>
  </Button>
</div>
