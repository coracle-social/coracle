<style>
  .wot-background {
    fill: transparent;
    stroke: var(--base-content);
    opacity: 30%;
  }

  .wot-highlight {
    fill: transparent;
    stroke-width: 1.5;
    stroke-dasharray: 100 100;
    transform-origin: center;
  }
</style>

<script lang="ts">
  import {clamp} from "@welshman/lib"

  export let score
  export let max = 100
  export let active = false

  const radius = 6
  const center = radius + 1

  $: normalizedScore = clamp([0, max], score) / max
  $: dashOffset = 100 - 44 * normalizedScore
  $: style = `transform: rotate(${135 - normalizedScore * 180}deg)`
  $: stroke = active ? "var(--primary)" : "var(--base-content)"
</script>

<div class="relative h-[14px] w-[14px]">
  <svg height="14" width="14" class="absolute">
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
</div>
