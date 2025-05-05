<script lang="ts">
  import {DateInput} from "date-picker-svelte"
  import {secondsToDate, dateToSeconds} from "@welshman/lib"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"

  interface Props {
    value?: number | undefined
  }

  let {value = $bindable()}: Props = $props()

  const pad = (n: number) => ("00" + String(n)).slice(-2)

  const getTime = (d: Date, m: string) => `${pad(d.getHours())}:${m}`

  const setTime = (d: Date, time: string) => {
    const [hours, minutes] = time.split(":").map(x => parseInt(x))
    const newDate = new Date(d)

    newDate.setHours(hours, minutes, 0, 0)

    return newDate
  }

  const onTimeChange = () => {
    if (time) {
      minutes = time.slice(-2)
      date = setTime(date || new Date(), time)
    }
  }

  const focusDate = () => element.querySelector("input")?.focus()

  const clear = () => {
    date = undefined
    time = undefined
  }

  const initialDate = value ? secondsToDate(value) : undefined
  const initialTime = initialDate ? getTime(initialDate, pad(initialDate.getMinutes())) : undefined
  const initialMinutes = initialTime ? initialTime.slice(-2) : "00"

  let date: Date | undefined = $state(initialDate)
  let time: string | undefined = $state(initialTime)
  let minutes: string = $state(initialMinutes)
  let element: HTMLElement

  // Sync date to time and value
  $effect(() => {
    if (date) {
      time = getTime(date, minutes)
      value = dateToSeconds(date)
    } else {
      value = undefined
    }
  })

  // Sync updates to value to date/time
  $effect(() => {
    const derivedDate = value ? secondsToDate(value) : undefined
    const derivedTime = derivedDate ? getTime(derivedDate, minutes) : undefined

    date = derivedDate
    time = derivedTime
  })
</script>

<div class="relative grid grid-cols-2 gap-2" bind:this={element}>
  <div class="relative">
    <DateInput format="yyyy-MM-dd" placeholder="" bind:value={date} />
    <div class="absolute right-2 top-0 flex h-12 cursor-pointer items-center gap-2">
      {#if date}
        <Button onclick={clear} class="h-5">
          <Icon icon="close-circle" />
        </Button>
      {:else}
        <Button onclick={focusDate} class="h-5">
          <Icon icon="calendar-minimalistic" />
        </Button>
      {/if}
    </div>
  </div>
  <label class="input input-bordered flex items-center">
    <input
      list="time-options"
      class="grow"
      type="time"
      step="300"
      bind:value={time}
      onchange={onTimeChange} />
  </label>
</div>
