<script lang="ts">
  import {Tags} from "paravel"
  import {whereEq} from "ramda"
  import Calendar from "@event-calendar/core"
  import DayGrid from "@event-calendar/day-grid"
  import Interaction from "@event-calendar/interaction"
  import {secondsToDate} from "src/util/misc"
  import {Naddr} from "src/util/nostr"
  import {themeColors} from "src/partials/state"
  import Anchor from 'src/partials/Anchor.svelte'
  import {router} from "src/app/router"
  import {canSign, load, pubkey} from "src/engine"

  export let relays
  export let filters
  export let group = null

  const createEvent = () =>
    router.at("notes/create").qp({type: "calendar_event", group}).open()

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

  const onEventClick = ({event: calendarEvent}) => {
    const event = events.find(whereEq({id: calendarEvent.id}))

    router.at("events").of(Naddr.fromEvent(event).asTagValue()).open()
  }

  let events = []

  load({
    relays,
    filters,
    onEvent: e => {
      events = events.concat(e)
    },
  })

  $: calendarEvents = events.map(e => {
    const meta = Tags.from(e).getDict()
    const isOwn = e.pubkey === $pubkey

    return {
      id: e.id,
      editable: isOwn,
      title: meta.name,
      start: secondsToDate(meta.start),
      end: secondsToDate(meta.end),
      backgroundColor: $themeColors[isOwn ? "accent" : "light"],
      _ctx: e,
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
