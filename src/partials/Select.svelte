<script lang="ts">
  import cx from "classnames"

  export let value
  export let onChange = null
  export let dark = false
</script>

<div class={cx($$props.class, "rounded relative shadow-inset cursor-pointer h-7", {
    "bg-neutral-900 text-neutral-100": dark,
    "bg-neutral-100 text-neutral-900": !dark,
  })}>
  <select {...$$props} class={cx("px-3 w-full bg-transparent h-7 pb-px", {
    "pl-10": $$slots.before,
    "pr-10": $$slots.after,
  })} bind:value on:change={() => onChange(value)}>
    <slot />
  </select>
  <div class="absolute left-0 top-0 flex gap-2 px-3 pt-3 text-tinted-700">
    <slot name="before" />
  </div>
  <div class="absolute right-0 top-0 flex gap-2 px-3 pt-3 text-tinted-700">
    <slot name="after" />
  </div>
</div>
