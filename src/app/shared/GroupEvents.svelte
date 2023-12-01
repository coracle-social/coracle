<script>
  import cx from "classnames"
  import {fade} from 'src/util/transition'
  import {dateToSeconds} from "src/util/misc"
  import {load, pubkey} from 'src/engine'

  export let group
  export let relays

  const changeDay = (d, x) => {
    const date = new Date(d)

    date.setDate(d.getDate() + x)

    return date
  }

  const generateMonth = date => ({
    date,
    days: getDaysInMonth(date.getFullYear(), date.getMonth()),
  })

  const getTimezoneOffset = () => new Date().getTimezoneOffset() * 60000

  function getDaysInMonth(year, month) {
    const days = []
    const firstDay = new Date(year, month, 1).getDay()
    const daysInThisMonth = new Date(year, month + 1, 0).getDate()
    const daysInLastMonth = new Date(year, month, 0).getDate()
    const prevMonth = month == 0 ? 11 : month - 1

    // show the days before the start of this month (disabled) - always less than 7
    for (let i = daysInLastMonth - firstDay; i < daysInLastMonth; i++) {
      days.push(new Date(prevMonth === 11 ? year - 1 : year, prevMonth, i + 1))
    }

    // show the days in this month (enabled) - always 28 - 31
    for (let i = 0; i < daysInThisMonth; i++) {
      days.push(new Date(year, month, i + 1))
    }

    // show any days to fill up the last row (disabled) - always less than 7
    for (let i = 0; days.length % 7; i++) {
      days.push(new Date(month == 11 ? year + 1 : year, (month + 1) % 12, i + 1))
    }

    return days
  }

  const getMeta = ({tags}) => {
    const meta = {}

    for (const [k, v] of tags) {
      meta[k] = v
    }

    return meta
  }

  const eventIsInRange = (date, event) => {
    const meta = getMeta(event)
    const startOfDay = dateToSeconds(date.setHours(0, 0, 0, 0))
    const endOfDay = dateToSeconds(date.setHours(23, 59, 59, 59))

    return parseInt(meta.start) <= endOfDay && parseInt(meta.end) >= startOfDay
  }

  const getDateEvents = date =>
    events
      .filter(e => eventIsInRange(date, e))
      .sort((a, b) => (getMeta(a).start > getMeta(b).start ? 1 : -1))

  let events = []
  let month = generateMonth(new Date())

  const prevMonth = () => {
    const y = month.date.getMonth() === 0 ? month.date.getFullYear() - 1 : month.date.getFullYear()
    const m = month.date.getMonth() === 0 ? 11 : month.date.getMonth() - 1

    month = generateMonth(new Date(y, m, 1))
  }

  const nextMonth = () => {
    const y = month.date.getMonth() === 11 ? month.date.getFullYear() + 1 : month.date.getFullYear()
    const m = month.date.getMonth() === 11 ? 0 : month.date.getMonth() + 1

    month = generateMonth(new Date(y, m, 1))
  }

  load({
    relays,
    filters: [{kinds: [31923], "#a": [$group.address]}],
    onEvent: e => {
      events = events.concat(e)
    },
  })

  $: console.log(events)
</script>

<div class="flex justify-between">
  <div class="border border-solid border-gray-5 rounded-full w-8 h-8 flex justify-center items-center cursor-pointer" on:click={prevMonth}>
    <i class="fa fa-caret-left" />
  </div>
  <span class="font-bold w-36 text-center">
    {month.date.toLocaleString("default", {month: "long", year: "numeric"})}
  </span>
  <div class="border border-solid border-gray-5 rounded-full w-8 h-8 flex justify-center items-center cursor-pointer" on:click={nextMonth}>
    <i class="fa fa-caret-right" />
  </div>
</div>

{#key events.length}
  <div class="border border-solid border-l border-t border-gray-6 rounded grid grid-cols-7">
    {#each month.days as date, i}
      <div class="text-gray-1 relative aspect-square text-xs">
        <div class="border border-solid border-r border-b border-gray-6 absolute inset-0" />
        <div class="p-1">
          {date.getDate()}
          <div class="flex flex-col gap-1">
            {#each getDateEvents(date) as event}
              {@const meta = getMeta(event)}
              {@const isContinuation = eventIsInRange(changeDay(date, -1), event)}
              {@const isContinued = eventIsInRange(changeDay(date, 1), event)}
              {@const isOwn = event.pubkey === $pubkey}
              <div
                in:fade
                class={cx("relative z-10 cursor-pointer whitespace-nowrap p-1 h-6", {
                  "z-20": (!isContinuation || date.getDay() === 0) && isContinued,
                  "text-accent border-accent border border-solid bg-white": !isOwn,
                  "bg-accent text-white": isOwn,
                  "-ml-1 border-l-0": isContinuation,
                  "rounded-s": !isContinuation,
                  "-mr-1 border-r-0": isContinued,
                  "overflow-hidden text-ellipsis rounded-e": !isContinued,
                  "text-white/0": isContinuation && date.getDay() !== 0,
                })}>
                {#if !isContinuation}
                  {meta.name}
                {/if}
              </div>
            {/each}
          </div>
        </div>
      </div>
    {/each}
  </div>
{/key}
