<script lang="ts">
  import {slide} from "src/util/transition"
</script>

<div
  in:slide={{delay: 500}}
  class="fixed bottom-0 bottom-14 left-0 right-0 rounded-t-xl bg-neutral-900 px-4 py-2 group-[.modal]:bottom-0 lg:bottom-0 lg:left-72 lg:group-[.modal]:left-0">
  <div class="m-auto flex max-w-2xl p-4">
    <slot />
  </div>
</div>
