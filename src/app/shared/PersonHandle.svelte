<script lang="ts">
  import cx from "classnames"
  import {displayHandle} from "src/domain"
  import {deriveHandle} from "src/engine"

  export let pubkey

  const handle = deriveHandle(pubkey)
</script>

{#if $handle}
  <div class={cx($$props.class, "overflow-hidden overflow-ellipsis opacity-75")}>
    {displayHandle($handle)}
  </div>
{/if}
