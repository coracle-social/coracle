<script lang="ts">
  import cx from "classnames"
  import Square from "src/partials/Square.svelte"
  import AltColor from "src/partials/AltColor.svelte"

  export let background = false
</script>

<AltColor {background} class={cx($$props.class, "overflow-hidden rounded-xl")} on:click>
  <Square class="flex aspect-square flex-grow flex-col">
    <slot />
  </Square>
</AltColor>
