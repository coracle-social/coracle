<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {readable} from "svelte/store"
  import {page} from "$app/stores"
  import {sortBy, now, last} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {REACTION, DELETE, EVENT_TIME, getTagValue} from "@welshman/util"
  import {formatTimestampAsDate} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import MenuSpaceButton from "@app/components/MenuSpaceButton.svelte"
  import EventItem from "@app/components/EventItem.svelte"
  import EventCreate from "@app/components/EventCreate.svelte"
  import {pushModal} from "@app/modal"
  import {GENERAL, getEventsForUrl, decodeRelay} from "@app/state"
  import {makeCalendarFeed} from "@app/requests"
  import {setChecked} from "@app/notifications"

  const url = decodeRelay($page.params.relay)

  const createEvent = () => pushModal(EventCreate, {url})

  const getEnd = (event: TrustedEvent) => parseInt(getTagValue("end", event.tags) || "")

  const getStart = (event: TrustedEvent) => parseInt(getTagValue("start", event.tags) || "")

  let element: HTMLElement
  let loading = $state(true)
  let cleanup: () => void
  let events: Readable<TrustedEvent[]> = $state(readable([]))

  type Item = {
    event: TrustedEvent
    dateDisplay?: string
  }

  const items = $derived(
    sortBy(e => getStart(e), $events).reduce<Item[]>((r, event) => {
      const end = getEnd(event)
      const start = getStart(event)

      if (isNaN(start) || isNaN(end)) return r

      const prevDateDisplay =
        r.length > 0 ? formatTimestampAsDate(getStart(last(r).event)) : undefined
      const newDateDisplay = formatTimestampAsDate(start)
      const dateDisplay = prevDateDisplay === newDateDisplay ? undefined : newDateDisplay

      return [...r, {event, dateDisplay}]
    }, []),
  )

  onMount(() => {
    const feedFilters = [{kinds: [EVENT_TIME], "#h": [GENERAL]}]
    const subscriptionFilters = [
      {kinds: [DELETE, REACTION, EVENT_TIME], "#h": [GENERAL], since: now()},
    ]

    ;({events, cleanup} = makeCalendarFeed({
      element,
      relays: [url],
      feedFilters,
      subscriptionFilters,
      initialEvents: getEventsForUrl(url, feedFilters),
      onExhausted: () => {
        loading = false
      },
    }))

    return () => {
      setChecked($page.url.pathname)
      cleanup()
    }
  })
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
  <div class="scroll-container flex flex-grow flex-col gap-2 overflow-auto p-2" bind:this={element}>
    {#each items as { event, dateDisplay }, i (event.id)}
      {#if dateDisplay}
        <Divider>{dateDisplay}</Divider>
      {/if}
      <EventItem {url} {event} />
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
    onclick={createEvent}>
    <div class="btn btn-circle btn-primary flex h-12 w-12 items-center justify-center">
      <Icon icon="calendar-add" />
    </div>
  </Button>
</div>
