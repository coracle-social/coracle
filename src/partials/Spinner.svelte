<script>
  import {fade} from 'svelte/transition'
  import {Circle2} from 'svelte-loading-spinners'
</script>

<div class="py-20 flex justify-center" in:fade={{delay: 1000}}>
  <Circle2 colorOuter="#CCC5B9" colorInner="#403D39" colorCenter="#EB5E28" />
</div>
