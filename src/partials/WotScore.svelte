<style>
  .wot-background {
    fill: transparent;
    stroke: var(--neutral-600);
  }

  .wot-highlight {
    fill: transparent;
    stroke-width: 1.5;
    stroke-dasharray: 100 100;
    transform-origin: center;
  }
</style>

<script lang="ts">
  import cx from "classnames"
  import {clamp} from "@welshman/lib"
  import {themeColors} from "src/partials/state"

  export let score
  export let max = 100
  export let accent = false

  const radius = 7
  const center = radius + 1

  $: normalizedScore = clamp([0, max], score) / max
  $: dashOffset = 100 - 44 * normalizedScore
  $: style = `transform: rotate(${135 - normalizedScore * 180}deg)`
  $: stroke = $themeColors[accent ? "accent" : "neutral-200"]
</script>

<svg viewBox="0 0 16 16" class={cx($$props.class, "h-4 w-4")}>
  <circle class="wot-background" cx={center} cy={center} r={radius} />
  <circle
    cx={center}
    cy={center}
    r={radius}
    class="wot-highlight"
    stroke-dashoffset={dashOffset}
    {style}
    {stroke} />
</svg>
