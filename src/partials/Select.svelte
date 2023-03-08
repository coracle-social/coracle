<script>
  import cx from "classnames"

  export let wrapperClass = ""
  export let value

  const className = cx(
    $$props.class,
    "rounded bg-light shadow-inset py-2 px-4 pr-10 text-black w-full text-dark",
    {"pl-10": $$slots.before, "pr-10": $$slots.after}
  )
</script>

<div class={cx(wrapperClass, "relative")}>
  <select {...$$props} class={className} bind:value>
    <slot />
  </select>
  <div class="absolute top-0 left-0 flex gap-2 px-3 pt-3 text-dark">
    <slot name="before" />
  </div>
  <div class="absolute top-0 right-0 flex gap-2 px-3 pt-3 text-dark">
    <slot name="after" />
  </div>
</div>
