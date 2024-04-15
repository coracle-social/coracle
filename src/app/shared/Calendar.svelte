<script lang="ts">
  import {fromPairs} from "ramda"
  import {batch} from "hurdak"
  import {onMount, onDestroy} from "svelte"
  import type {Event} from "nostr-tools"
  import {writable} from "@coracle.social/lib"
  import {getAddress, getReplyFilters} from "@coracle.social/util"
  import Calendar from "@event-calendar/core"
  import DayGrid from "@event-calendar/day-grid"
  import Interaction from "@event-calendar/interaction"
  import {secondsToDate} from "src/util/misc"
  import {themeColors} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import {
    hints,
    load,
    pubkey,
    canSign,
    isDeleted,
    subscribe,
    feedLoader,
    getFilterSelections,
    forcePlatformRelaySelections,
  } from "src/engine"
  import {router} from "src/app/util/router"

  export let feed
  export let group = null

  const createEvent = () => router.at("notes/create").qp({type: "calendar_event", group}).open()

  const getEventContent = ({event}) => event.title

  const onDateClick = ({date}) => {
    if ($canSign) {
      date.setHours(new Date().getHours() + 1, 0, 0)

      const initialValues = {
        start: date,
        end: date,
      }

      router.at("notes/create").qp({type: "calendar_event"}).cx({initialValues}).open()
    }
  }

  const onEventClick = ({event: calendarEvent}) => router.at("events").of(calendarEvent.id).open()

  const events = writable(new Map())

  const onEvent = batch(300, (chunk: Event[]) => {
    events.update($events => {
      for (const e of chunk) {
        const addr = getAddress(e)
        const dup = $events.get(addr)

        // Make sure we have the latest version of every event
        $events.set(addr, dup?.created_at > e.created_at ? dup : e)
      }

      return $events
    })

    // Load deletes for these events
    load({
      relays: hints.merge(chunk.map(e => hints.EventChildren(e))).getUrls(),
      filters: getReplyFilters(chunk, {kinds: [5]}),
    })
  })

  let subs = []

  onMount(async () => {
    const {filters} = await feedLoader.compiler.compile(feed)
    const selections = getFilterSelections(filters)

    subs = forcePlatformRelaySelections(selections).map(({relay, filters}) =>
      subscribe({relays: [relay], filters, onEvent}),
    )
  })

  onDestroy(() => subs.map(sub => sub.close()))

  $: calendarEvents = Array.from($events.values())
    .filter(e => !$isDeleted(e))
    .map(e => {
      const meta = fromPairs(e.tags)
      const isOwn = e.pubkey === $pubkey

      return {
        editable: isOwn,
        id: getAddress(e),
        title: meta.title || meta.name, // Backwards compat with a bug
        start: secondsToDate(meta.start),
        end: secondsToDate(meta.end),
        backgroundColor: $themeColors[isOwn ? "accent" : "neutral-100"],
      }
    })
</script>

{#if $canSign}
  <div class="relative h-0">
    <div class="absolute right-44 top-4">
      <Anchor button accent style="height: 38px; width: 38px;" on:click={createEvent}>
        <i class="fa fa-plus" />
      </Anchor>
    </div>
  </div>
{/if}

<Calendar
  plugins={[Interaction, DayGrid]}
  options={{
    view: "dayGridMonth",
    events: calendarEvents,
    dateClick: onDateClick,
    eventClick: onEventClick,
    eventContent: getEventContent,
    eventStartEditable: false,
    eventDragMinDistance: 10000,
    eventTextColor: $themeColors["neutral-900"],
    longPressDelay: 10000,
    buttonText: {
      today: "Today",
    },
  }} />
