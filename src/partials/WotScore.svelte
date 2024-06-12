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
  import {themeColors} from "src/partials/state"

  export let score
  export let max = 100
  export let accent = false

  $: superMaxWot = max * 1.5
  $: dashOffset = 100 - (Math.max(superMaxWot / 20, score) / superMaxWot) * 100
  $: style = `transform: rotate(${dashOffset * 1.8 - 50}deg)`
  $: stroke = $themeColors[accent ? 'accent' : 'neutral-200']
</script>

<span class="relative flex h-10 w-10 items-center justify-center whitespace-nowrap px-4 text-xs">
  <svg height="32" width="32" class="absolute">
    <circle class="wot-background" cx="16" cy="16" r="15" />
    <circle
      cx="16"
      cy="16"
      r="15"
      class="wot-highlight"
      stroke-dashoffset={dashOffset}
      {style}
      {stroke} />
  </svg>
  {score}
</span>
