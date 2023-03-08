<script>
  import cx from "classnames"
  import {fly} from "svelte/transition"

  export let interactive = false
  export let invertColors = false
</script>

<div
  on:click
  in:fly={{y: 20}}
  class={cx($$props.class, "card rounded-2xl bg-dark p-3 text-white", {
    "border border-solid border-medium bg-dark": !invertColors,
    "border border-solid border-shimmer bg-medium": invertColors,
    "cursor-pointer transition-all": interactive,
    "hover:bg-medium": interactive && !invertColors,
    "hover:bg-dark": interactive && invertColors,
  })}>
  <slot />
</div>
