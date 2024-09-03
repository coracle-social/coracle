<script lang="ts">
  import cx from "classnames"
  import {deriveHandle, displayHandle} from "@welshman/app"

  export let pubkey

  const handle = deriveHandle(pubkey)
</script>

{#if $handle}
  <div class={cx($$props.class, "overflow-hidden overflow-ellipsis opacity-75")}>
    {displayHandle($handle)}
  </div>
{/if}
