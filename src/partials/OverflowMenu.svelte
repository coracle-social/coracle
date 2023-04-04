<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"

  export let actions
</script>

<div
  class="absolute inset-0 rounded-full bg-gray-8"
  style="filter: blur(15px) opacity(0.7)" />

{#each actions as {label, icon, onClick}}
<div class="z-10 flex gap-2 justify-end items-center cursor-pointer" on:click={onClick}>
  {label} <Anchor type="button-circle"><i class={`fa fa-${icon}`} /></Anchor>
</div>
{/each}
