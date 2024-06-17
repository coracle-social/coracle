<script lang="ts">
  import cx from "classnames"
  import Anchor from "src/partials/Anchor.svelte"

  export let inert = false
  export let active = false
</script>

<Anchor
  {...$$props}
  class={cx($$props.class, "block p-3 px-4", {
    "bg-accent text-neutral-100": active,
    "transition-all hover:bg-accent hover:text-neutral-100": !inert,
  })}
  on:click>
  <slot />
</Anchor>
