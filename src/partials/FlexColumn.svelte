<script lang="ts">
  import cx from "classnames"

  export let xl = false
  export let xs = false
  export let small = false
  export let large = false
  export let narrow = false
  export let element = null

  const className = cx("flex flex-col m-auto min-w-0 w-full", $$props.class, {
    "gap-1": xs,
    "gap-2": small,
    "gap-4": !small && !large && !xl && !xs,
    "gap-6": large,
    "gap-8": xl,
    "max-w-md": narrow,
  })
</script>

<div {...$$props} bind:this={element} class={className}>
  <slot />
</div>
