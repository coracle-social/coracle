<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"

  const className = "relative staatliches h-12 block transition-all text-light hover:text-warm"
</script>

<Anchor {...$$props} class={className} on:click>
  <slot />
</Anchor>

