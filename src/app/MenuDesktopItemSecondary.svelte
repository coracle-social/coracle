<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"

  const className = "relative staatliches h-12 block transition-all text-neutral-300 hover:text-tinted-200"
</script>

<Anchor {...$$props} class={className} on:click>
  <slot />
</Anchor>
