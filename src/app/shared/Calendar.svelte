<script lang="ts">
  import {batch} from "hurdak"
  import {onMount} from "svelte"
  import {fromPairs} from "@welshman/lib"
  import {getAddress, getReplyFilters} from "@welshman/util"
  import type {TrustedEvent} from "@welshman/util"
  import {feedFromFilter} from "@welshman/feeds"
  import Calendar from "@event-calendar/core"
  import DayGrid from "@event-calendar/day-grid"
  import Interaction from "@event-calendar/interaction"
  import {secondsToDate} from "src/util/misc"
  import {themeColors} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import {hints, load, pubkey, canSign, loadAll, deriveEventsMapped} from "src/engine"
  import {router} from "src/app/util/router"

  export let filter
  export let group = null

  const calendarEvents = deriveEventsMapped({
    filters: [filter],
    itemToEvent: (item: any) => item.event,
    eventToItem: (event: TrustedEvent) => {
      const meta = fromPairs(event.tags)
      const isOwn = event.pubkey === $pubkey

      return {
        event,
        editable: isOwn,
        id: getAddress(event),
        title: meta.title || meta.name, // Backwards compat with a bug
        start: secondsToDate(meta.start),
        end: secondsToDate(meta.end),
        backgroundColor: $themeColors[isOwn ? "accent" : "neutral-100"],
      }
    },
  })

  const createEvent = () => router.at("notes/create").qp({type: "calendar_event", group}).open()

  const getEventContent = ({event}) => event.title

  const onDateClick = ({date}) => {
    if ($canSign) {
      date.setHours(new Date().getHours() + 1, 0, 0)

      const initialValues = {
        start: date,
        end: date,
      }

      router.at("notes/create").qp({type: "calendar_event", group}).cx({initialValues}).open()
    }
  }

  const onEventClick = ({event: calendarEvent}) => router.at("events").of(calendarEvent.id).open()

  onMount(() => {
    loadAll(feedFromFilter(filter), {
      // Load deletes for these events
      onEvent: batch(300, (chunk: TrustedEvent[]) => {
        load({
          relays: hints.merge(chunk.map(e => hints.EventChildren(e))).getUrls(),
          filters: getReplyFilters(chunk, {kinds: [5]}),
        })
      }),
    })
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

{#key $calendarEvents.length}
  <Calendar
    plugins={[Interaction, DayGrid]}
    options={{
      view: "dayGridMonth",
      events: $calendarEvents,
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
{/key}
