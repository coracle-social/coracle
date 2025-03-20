<script lang="ts">
  import {page} from "$app/stores"
  import Button from "@lib/components/Button.svelte"

  const {
    children,
    onclick = undefined,
    title = "",
    href = "",
    prefix = "",
    notification = false,
    ...restProps
  } = $props()

  const active = $derived($page.url?.pathname?.startsWith(prefix || href || "bogus"))
</script>

{#if href}
  <a {href} class="relative z-nav-item flex h-14 w-14 items-center justify-center">
    <div
      class="avatar cursor-pointer rounded-full p-1 {restProps.class} transition-colors hover:bg-base-300"
      class:bg-base-300={active}
      class:tooltip={title}
      data-tip={title}>
      {@render children?.()}
      {#if !active && notification}
        <div class="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary"></div>
      {/if}
    </div>
  </a>
{:else}
  <Button {onclick} class="relative z-nav-item flex h-14 w-14 items-center justify-center">
    <div
      class="avatar cursor-pointer rounded-full p-1 {restProps.class} transition-colors hover:bg-base-300"
      class:bg-base-300={active}
      class:tooltip={title}
      data-tip={title}>
      {@render children?.()}
      {#if !active && notification}
        <div class="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary"></div>
      {/if}
    </div>
  </Button>
{/if}
