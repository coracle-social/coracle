<script lang="ts">
  import {fade} from "src/util/transition"
  import {themeColors} from "src/partials/state"
  import {Circle2} from "svelte-loading-spinners"

  export let delay = 1000

  const {dark, light, accent} = $themeColors
</script>

<div class="flex flex-col items-center justify-center gap-4 py-20" in:fade|local={{delay}}>
  <slot />
  <img src="https://pablof7z.com/images/me.jpg" class="fa-spin h-20 w-20 rounded-full" />
  <!-- <Circle2 colorOuter={accent} colorInner={dark} colorCenter={light} /> -->
</div>
