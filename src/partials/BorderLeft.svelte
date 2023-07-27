<script lang="ts">
  import Anchor from 'src/partials/Anchor.svelte'
</script>

<Anchor
  type="unstyled"
  class="flex gap-4 border-l-2 border-solid border-gray-6 py-2 px-4 transition-all
         hover:border-accent hover:bg-gray-8 hover:pl-5"
  on:click>
  <slot />
</Anchor>
