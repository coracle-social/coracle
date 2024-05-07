<script lang="ts">
  import cx from "classnames"

  export let value
  export let onChange = null
  export let wrapperClass = ""

  const className = cx($$props.class, "rounded shadow-inset px-4 w-full cursor-pointer", {
    "pl-10": $$slots.before,
    "pr-10": $$slots.after,
  })
</script>

<div class={cx(wrapperClass, "relative")}>
  <select {...$$props} class={className} bind:value on:change={() => onChange(value)}>
    <slot />
  </select>
  <div class="absolute left-0 top-0 flex gap-2 px-3 pt-3 text-tinted-700">
    <slot name="before" />
  </div>
  <div class="absolute right-0 top-0 flex gap-2 px-3 pt-3 text-tinted-700">
    <slot name="after" />
  </div>
</div>
