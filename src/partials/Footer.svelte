<script lang="ts">
  import {slide} from "src/util/transition"
</script>

<div
  in:slide={{delay: 500}}
  class="fixed bottom-[calc(var(--saib)+3.5rem)] left-0 right-0 rounded-t-xl bg-neutral-900 px-4 py-2 lg:bottom-0 lg:left-72">
  <div class="m-auto flex max-w-2xl p-4">
    <slot />
  </div>
</div>
