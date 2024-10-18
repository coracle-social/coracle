<script lang="ts">
  import cx from "classnames"
  import {deriveHandleForPubkey, displayHandle} from "@welshman/app"

  export let pubkey

  const handle = deriveHandleForPubkey(pubkey)
</script>

{#if $handle}
  <div class={cx($$props.class, "overflow-hidden overflow-ellipsis")}>
    {displayHandle($handle)}
  </div>
  <slot />
{/if}
