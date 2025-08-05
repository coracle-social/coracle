<script lang="ts">
  import cx from "classnames"
  import Link from "src/partials/Link.svelte"
  import Button from "src/partials/Button.svelte"

  export let href = ""
  export let inert = false
  export let active = false

  const className = cx($$props.class, "block p-3 px-4 w-full", {
    "bg-accent text-neutral-100": active,
    "transition-all hover:bg-accent hover:text-neutral-100": !inert,
  })
</script>

{#if href}
  <Link {...$$props} {href} class={className} on:click>
    <slot />
  </Link>
{:else}
  <Button {...$$props} class={className} on:click>
    <slot />
  </Button>
{/if}
