<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
</script>

<Anchor {...$$props} class="block p-3 px-4 transition-all hover:bg-accent hover:text-white" on:click>
  <slot />
</Anchor>
