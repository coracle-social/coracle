<script lang="ts">
  import cx from "classnames"
  import Link from "src/partials/Link.svelte"
  import Button from "src/partials/Button.svelte"

  export let href = ""

  const className = cx(
    $$props.class,
    "flex h-28 w-28 flex-col items-center justify-center gap-3 rounded-xl bg-tinted-700",
  )
</script>

{#if href}
  <Link {href} {...$$props} randomizeKey class={className} on:click>
    <slot />
  </Link>
{:else}
  <Button {...$$props} class={className} on:click>
    <slot />
  </Button>
{/if}
