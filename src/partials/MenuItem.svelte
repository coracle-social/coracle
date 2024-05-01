<script lang="ts">
  import cx from "classnames"
  import Anchor from "src/partials/Anchor.svelte"

  export let inert = false
</script>

<Anchor
  {...$$props}
  class={cx($$props.class, "block p-3 px-4", {
    "transition-all hover:bg-accent hover:text-white": !inert,
  })}
  on:click>
  <slot />
</Anchor>
