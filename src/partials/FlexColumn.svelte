<script lang="ts">
  import cx from "classnames"

  export let xl = false
  export let small = false
  export let large = false
  export let narrow = false

  const className = cx("flex flex-col overflow-hidden text-ellipsis m-auto min-w-0 w-full", $$props.class, {
    "gap-2": small,
    "gap-4": !small && !large && !xl,
    "gap-6": large,
    "gap-8": xl,
    "max-w-md": narrow,
  })
</script>

<div {...$$props} class={className}>
  <slot />
</div>
