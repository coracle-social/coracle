<script lang="ts">
  import {Tags} from "paravel"
  import {batch} from "hurdak"
  import {onMount} from "svelte"
  import Calendar from "@event-calendar/core"
  import DayGrid from "@event-calendar/day-grid"
  import Interaction from "@event-calendar/interaction"
  import {secondsToDate} from "src/util/misc"
  import {Naddr, LOCAL_RELAY_URL} from "src/util/nostr"
  import {themeColors} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/router"
  import {canSign, writable, getReplyFilters, load, isDeleted, subscribe, pubkey} from "src/engine"

  export let relays
  export let filters
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

  onMount(() => {
    const sub = subscribe({
      filters,
      relays: relays.concat(LOCAL_RELAY_URL),
      onEvent: batch(300, chunk => {
        events.update($events => {
          for (const e of chunk) {
            const addr = Naddr.fromEvent(e).asTagValue()
            const dup = $events.get(addr)

            // Make sure we have the latest version of every event
            $events.set(addr, dup?.created_at > e.created_at ? dup : e)
          }

          return $events
        })

        // Load deletes for these events
        load({relays, filters: getReplyFilters(chunk, {kinds: [5]})})
      }),
    })

    return () => sub.close()
  })

  $: calendarEvents = Array.from($events.values())
    .filter(e => !$isDeleted(e))
    .map(e => {
      const meta = Tags.from(e).getDict()
      const isOwn = e.pubkey === $pubkey

      return {
        editable: isOwn,
        id: Naddr.fromEvent(e).asTagValue(),
        title: meta.title || meta.name, // Backwards compat with a bug
        start: secondsToDate(meta.start),
        end: secondsToDate(meta.end),
        backgroundColor: $themeColors[isOwn ? "accent" : "light"],
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
    longPressDelay: 10000,
    buttonText: {
      today: "Today",
    },
  }} />
