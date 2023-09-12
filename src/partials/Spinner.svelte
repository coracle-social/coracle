<script lang="ts">
  import {fade} from "src/util/transition"
  import {Circle2} from "svelte-loading-spinners"

  export let delay = 1000
</script>

<div class="flex flex-col items-center justify-center gap-4 py-20" in:fade={{delay}}>
  <slot />
  <Circle2 colorOuter="#CCC5B9" colorInner="#403D39" colorCenter="#EB5E28" />
</div>
