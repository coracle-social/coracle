<script lang="ts">
  import cx from "classnames"
  import {DateInput} from "date-picker-svelte"
  import {createLocalDate, formatDateAsLocalISODate} from "src/util/misc"

  export let initialValue = null
  export let value = initialValue

  let date = value ? createLocalDate(value) : new Date()

  const className = cx(
    $$props.class,
    "rounded-full shadow-inset py-2 px-4 w-full placeholder:text-gray-5",
    "bg-input border border-solid border-gray-3 text-black pl-10"
  )

  const setDate = d => {
    date = d
    value = formatDateAsLocalISODate(d).slice(0, 10)
  }

  const init = () => {
    if (!value) {
      setDate(new Date())
    }
  }

  const clear = () => {
    value = null
  }

  $: value && setDate(date)
</script>

<div class={cx(className, "relative")}>
  <div class:opacity-0={!value} on:click={init}>
    <DateInput format="yyyy-MM-dd" bind:value={date} />
  </div>
  <div class="absolute left-0 top-0 flex gap-2 px-4 pt-3 text-black opacity-75">
    <i class="fa fa-calendar-days" />
  </div>
  {#if value}
    <div
      class="absolute right-0 top-0 m-px flex cursor-pointer gap-2 rounded-full px-4 pt-3 text-black opacity-75"
      on:click={clear}>
      <i class="fa fa-times" />
    </div>
  {/if}
</div>
