<script lang="ts">
  import cx from "classnames"
  import {createEventDispatcher} from 'svelte'

  export let wrapperClass = ""
  export let value

  const dispatch = createEventDispatcher()

  const onChange = e => dispatch('change', e.target.value)

  const className = cx(
    $$props.class,
    "rounded text-neutral-100 shadow-inset py-2 px-4 pr-10 text-black w-full text-tinted-700",
    {"pl-10": $$slots.before, "pr-10": $$slots.after},
  )
</script>

<div class={cx(wrapperClass, "relative")}>
  <select {...$$props} class={className} bind:value on:change={onChange}>
    <slot />
  </select>
  <div class="absolute left-0 top-0 flex gap-2 px-3 pt-3 text-tinted-700">
    <slot name="before" />
  </div>
  <div class="absolute right-0 top-0 flex gap-2 px-3 pt-3 text-tinted-700">
    <slot name="after" />
  </div>
</div>
