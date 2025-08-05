<script lang="ts">
  import cx from "classnames"
  import Link from "src/partials/Link.svelte"

  export let href = ""
</script>

<Link
  {href}
  {...$$props}
  randomizeKey
  class={cx(
    $$props.class,
    "flex h-28 w-28 flex-col items-center justify-center gap-3 rounded-xl bg-tinted-700",
  )}
  on:click>
  <slot />
</Link>
