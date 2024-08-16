<script lang="ts">
  import Button from "@lib/components/Button.svelte"

  export let title = ""
  export let href = ""
</script>

{#if href}
  <a {href} class="relative z-nav-item flex h-14 w-14 items-center justify-center">
    <div
      class="avatar tooltip-right cursor-pointer rounded-full bg-base-300 p-1"
      class:tooltip={title}
      data-tip={title}>
      <slot />
    </div>
  </a>
{:else}
  <Button on:click class="relative z-nav-item flex h-14 w-14 items-center justify-center">
    <div
      class="avatar tooltip-right cursor-pointer rounded-full bg-base-300 p-1"
      class:tooltip={title}
      data-tip={title}>
      <slot />
    </div>
  </Button>
{/if}
