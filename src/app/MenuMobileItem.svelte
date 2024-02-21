<script lang="ts">
  import cx from "classnames"
  import Anchor from "src/partials/Anchor.svelte"
</script>

<Anchor
  {...$$props}
  randomizeKey
  class={cx(
    $$props.class,
    "flex h-28 w-28 flex-col items-center justify-center gap-3 rounded-xl bg-tinted-700",
  )}
  on:click>
  <slot />
</Anchor>
