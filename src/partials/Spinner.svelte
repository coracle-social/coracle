<script lang="ts">
  import {fade} from "src/util/transition"
  import {themeColors} from "src/partials/state"
  import {Circle2} from "svelte-loading-spinners"

  export let delay = 1000
</script>

<div class="flex flex-col items-center justify-center gap-4 py-20" in:fade|local={{delay}}>
  <slot />
  <Circle2
    colorOuter={$themeColors.accent}
    colorInner={$themeColors["neutral-600"]}
    colorCenter={$themeColors["tinted-200"]} />
</div>
