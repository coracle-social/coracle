<script lang="ts">
  import cx from 'classnames'
  import Anchor from "src/partials/Anchor.svelte"
</script>

<Anchor {...$$props} class={cx($$props.class, "p-3 flex flex-col items-center gap-3")} on:click>
  <slot />
</Anchor>
