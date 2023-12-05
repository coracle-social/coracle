<script lang="ts">
  import {Tags} from "paravel"
  import {whereEq} from "ramda"
  import Calendar from "@event-calendar/core"
  import DayGrid from "@event-calendar/day-grid"
  import Interaction from "@event-calendar/interaction"
  import {secondsToDate} from "src/util/misc"
  import {Naddr} from "src/util/nostr"
  import {themeColors} from "src/partials/state"
  import {router} from "src/app/router"
  import {load, pubkey} from "src/engine"

  export let group
  export let relays

  const getEventContent = ({event}) => event.title

  const onDateClick = ({date}) => {
    date.setHours(new Date().getHours() + 1, 0, 0)

    const initialValues = {
      start: date,
      end: date,
    }

    router.at("notes/create").qp({type: "calendar_event"}).cx({initialValues}).open()
  }

  const onEventClick = ({event: calendarEvent}) => {
    const event = events.find(whereEq({id: calendarEvent.id}))

    router.at("events").of(Naddr.fromEvent(event).asTagValue()).open()
  }

  let events = []

  load({
    relays,
    filters: [{kinds: [31923], "#a": [$group.address]}],
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
      backgroundColor: $themeColors[isOwn ? "accent" : "gray-2"],
      _ctx: e,
    }
  })
</script>

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
