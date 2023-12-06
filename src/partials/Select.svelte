<script lang="ts">
  import cx from "classnames"

  export let wrapperClass = ""
  export let value

  const className = cx(
    $$props.class,
    "rounded text-lightest shadow-inset py-2 px-4 pr-10 text-black w-full text-cocoa",
    {"pl-10": $$slots.before, "pr-10": $$slots.after}
  )
</script>

<div class={cx(wrapperClass, "relative")}>
  <select {...$$props} class={className} bind:value>
    <slot />
  </select>
  <div class="absolute left-0 top-0 flex gap-2 px-3 pt-3 text-cocoa">
    <slot name="before" />
  </div>
  <div class="absolute right-0 top-0 flex gap-2 px-3 pt-3 text-cocoa">
    <slot name="after" />
  </div>
</div>
