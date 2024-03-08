<script lang="ts">
  import {slide} from 'src/util/transition'
</script>

<div in:slide={{delay: 500}} class="fixed bottom-0 left-0 right-0 bottom-14 lg:bottom-0 lg:left-72 lg:group-[.modal]:left-0 group-[.modal]:bottom-0 bg-neutral-900 px-4 py-2 rounded-t-xl">
  <div class="max-w-2xl m-auto p-4 flex">
    <slot />
  </div>
</div>
