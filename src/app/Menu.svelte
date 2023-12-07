<script lang="ts">
  import MenuMobile from "src/app/MenuMobile.svelte"
  import MenuDesktop from "src/app/MenuDesktop.svelte"

  let innerWidth = 0
</script>

<svelte:window bind:innerWidth />

{#if innerWidth < 1024}
  <MenuMobile />
{:else}
  <MenuDesktop />
{/if}
