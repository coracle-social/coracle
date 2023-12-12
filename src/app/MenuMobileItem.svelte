<script lang="ts">
  import cx from 'classnames'
  import Anchor from "src/partials/Anchor.svelte"
</script>

<Anchor
  {...$$props}
  class={cx($$props.class, "h-28 w-28 flex flex-col justify-center items-center gap-3 bg-cocoa rounded-xl")}
  on:click>
  <slot />
</Anchor>
