<script lang="ts">
  import {DateInput} from "date-picker-svelte"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"

  interface Props {
    value?: Date | undefined
  }

  let {value = $bindable()}: Props = $props()

  const pad = (n: number) => ("00" + String(n)).slice(-2)

  const defaultTime = `${pad(new Date().getHours())}:00`

  const focusDate = () => element.querySelector("input")?.focus()

  const syncTime = (d: Date) => {
    if (!time) {
      time = defaultTime
    }

    const [hours, minutes] = time.split(":").map(x => parseInt(x))

    d.setHours(hours, minutes, 0, 0)

    return d
  }

  const onchange = () => {
    if (value) {
      value = syncTime(value)
    }
  }

  const clear = () => {
    value = undefined
    time = ""
  }

  let time = $state("")
  let element: HTMLElement

  $effect(() => {
    if (value) {
      value = syncTime(value)
    }
  })
</script>

<div class="relative grid grid-cols-2 gap-2" bind:this={element}>
  <div class="relative">
    <DateInput format="yyyy-MM-dd" placeholder="" bind:value on:change={onchange} />
    <div class="absolute right-2 top-0 flex h-12 cursor-pointer items-center gap-2">
      {#if value}
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
    <input list="time-options" class="grow" type="time" step="300" bind:value={time} {onchange} />
  </label>
</div>
