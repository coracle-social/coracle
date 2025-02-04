<script lang="ts">
  import {page} from "$app/stores"
  import Button from "@lib/components/Button.svelte"

  let {title = "", href = "", prefix = "", notification = false, ...restProps} = $props()

  const active = $derived($page.url?.pathname?.startsWith(prefix || href || "bogus"))
</script>

{#if href}
  <a {href} class="relative z-nav-item flex h-14 w-14 items-center justify-center">
    <div
      class="avatar cursor-pointer rounded-full p-1 {restProps.class} transition-colors hover:bg-base-300"
      class:bg-base-300={active}
      class:tooltip={title}
      data-tip={title}>
      <slot />
      {#if !active && notification}
        <div class="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary"></div>
      {/if}
    </div>
  </a>
{:else}
  <Button on:click class="relative z-nav-item flex h-14 w-14 items-center justify-center">
    <div
      class="avatar cursor-pointer rounded-full p-1 {restProps.class} transition-colors hover:bg-base-300"
      class:bg-base-300={active}
      class:tooltip={title}
      data-tip={title}>
      <slot />
      {#if !active && notification}
        <div class="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary"></div>
      {/if}
    </div>
  </Button>
{/if}
