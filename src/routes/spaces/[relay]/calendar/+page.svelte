<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {readable} from "svelte/store"
  import {page} from "$app/stores"
  import {now, last} from "@welshman/lib"
  import type {TrustedEvent} from "@welshman/util"
  import {REACTION, DELETE, EVENT_TIME, getTagValue} from "@welshman/util"
  import {formatTimestampAsDate} from "@welshman/app"
  import {fly} from "@lib/transition"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import PageBar from "@lib/components/PageBar.svelte"
  import Divider from "@lib/components/Divider.svelte"
  import MenuSpaceButton from "@app/components/MenuSpaceButton.svelte"
  import CalendarEventItem from "@app/components/CalendarEventItem.svelte"
  import CalendarEventCreate from "@app/components/CalendarEventCreate.svelte"
  import {pushModal} from "@app/modal"
  import {GENERAL, getEventsForUrl, decodeRelay} from "@app/state"
  import {makeCalendarFeed} from "@app/requests"
  import {setChecked} from "@app/notifications"

  const url = decodeRelay($page.params.relay)

  const createEvent = () => pushModal(CalendarEventCreate, {url})

  const getStart = (event: TrustedEvent) => parseInt(getTagValue("start", event.tags) || "")

  let element: HTMLElement
  let loading = $state(true)
  let cleanup: () => void
  let events: Readable<TrustedEvent[]> = $state(readable([]))

  type Item = {
    event: TrustedEvent
    dateDisplay?: string
    isFirstFutureEvent?: boolean
  }

  const items = $derived.by(() => {
    const todayDateDisplay = formatTimestampAsDate(now())

    let haveISeenTheFuture = false
    let prevDateDisplay: string

    return $events.map<Item>(event => {
      const newDateDisplay = formatTimestampAsDate(getStart(event))
      const dateDisplay = prevDateDisplay === newDateDisplay ? undefined : newDateDisplay
      const isFuture = todayDateDisplay === newDateDisplay || event.created_at > now()
      const isFirstFutureEvent = !haveISeenTheFuture && isFuture

      prevDateDisplay = newDateDisplay
      haveISeenTheFuture = isFuture

      return {event, dateDisplay, isFirstFutureEvent}
    })
  })

  let previousScrollHeight = 0
  let prevFirstEventId = ""
  let initialScrollDone = false

  $effect(() => {
    if (items.length === 0) {
      return
    }

    if (initialScrollDone) {
      // If new events are prepended, adjust the scroll position so that the viewport content remains anchored
      if (prevFirstEventId && items[0].event.id !== prevFirstEventId) {
        const newScrollHeight = element.scrollHeight
        const delta = newScrollHeight - previousScrollHeight

        if (delta > 0) {
          element.scrollTop += delta
        }
      }
    } else {
      const {event} = items.find(({event}) => getStart(event) >= now()) || last(items)
      const {offsetTop, clientHeight} = document.querySelector(
        ".calendar-event-" + event.id,
      ) as HTMLElement

      // On initial load, center the scroll container on today's date (or the next available event)
      element.scrollTop = offsetTop - element.clientHeight / 2 + clientHeight / 2
      initialScrollDone = true
    }

    previousScrollHeight = element.scrollHeight
    prevFirstEventId = items[0].event.id
  })

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
      <div class="row-2">
        <Button class="btn btn-primary btn-sm" onclick={createEvent}>
          <Icon icon="calendar-add" />
          Create an Event
        </Button>
        <MenuSpaceButton {url} />
      </div>
    {/snippet}
  </PageBar>
  <div class="scroll-container flex flex-grow flex-col gap-2 overflow-auto p-2" bind:this={element}>
    {#each items as { event, dateDisplay, isFirstFutureEvent }, i (event.id)}
      <div class={"calendar-event-" + event.id}>
        {#if isFirstFutureEvent}
          <div class="flex items-center gap-2 p-2">
            <div class="h-px flex-grow bg-primary"></div>
            <p class="text-xs uppercase text-primary">Today</p>
            <div class="h-px flex-grow bg-primary"></div>
          </div>
        {/if}
        {#if dateDisplay}
          <Divider>{dateDisplay}</Divider>
        {/if}
        <CalendarEventItem {url} {event} />
      </div>
    {/each}
    {#if loading}
      <p class="flex h-10 items-center justify-center py-20" transition:fly>
        <Spinner {loading}>Looking for events...</Spinner>
      </p>
    {:else if items.length === 0}
      <p class="flex h-10 items-center justify-center py-20" transition:fly>No events found.</p>
    {:else}
      <p class="flex h-10 items-center justify-center py-20" transition:fly>That's all!</p>
    {/if}
  </div>
</div>
