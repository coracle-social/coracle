<script lang="ts">
  import cx from "classnames"
  import logger from "src/util/logger"
  import {DateInput} from "date-picker-svelte"
  import {createLocalDate} from "@welshman/lib"
  import {formatDateAsLocalISODate} from "src/util/misc"

  export let onChange = null
  export let initialValue = null
  export let value = initialValue

  const className = cx(
    $$props.class,
    "rounded-full shadow-inset py-2 px-4 w-full placeholder:text-neutral-400",
    "bg-white border border-solid border-neutral-200 text-black pl-10",
  )

  const toDate = v => (v ? createLocalDate(v) : null)

  const setValue = newValue => {
    if (value === newValue) {
      return
    }

    value = newValue
    date = toDate(value)
    onChange?.(value)
  }

  const setDate = d => {
    try {
      setValue(formatDateAsLocalISODate(d).slice(0, 10))
    } catch (e) {
      logger.error(e)
    }
  }

  const init = () => {
    if (!value) {
      setDate(new Date())
    }
  }

  const clear = () => setValue(null)

  let date = toDate(value)

  $: {
    if (date) {
      setDate(date)
    } else {
      setValue(null)
    }
  }
</script>

<div class={cx(className, "relative")}>
  <button type="button" class:opacity-0={!value} on:click={init}>
    <DateInput format="yyyy-MM-dd" bind:value={date} />
  </button>
  <div class="absolute left-0 top-0 flex gap-2 px-4 pt-3 text-black opacity-75">
    <i class="fa fa-calendar-days" />
  </div>
  {#if value}
    <button
      type="button"
      class="absolute right-0 top-0 m-px flex cursor-pointer gap-2 rounded-full px-4 pt-3 text-black opacity-75"
      on:click={clear}>
      <i class="fa fa-times" />
    </button>
  {/if}
</div>
