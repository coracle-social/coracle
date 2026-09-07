<script lang="ts">
  import cx from "classnames"
  import {displayHandle} from "@welshman/util"
  import {Handles} from "@welshman/app"
  import {fromApp} from "src/engine/core"

  export let pubkey

  const handle = fromApp($app => $app.use(Handles).forPubkey(pubkey).$)
</script>

{#if $handle}
  <div class={cx($$props.class, "overflow-hidden overflow-ellipsis")}>
    {displayHandle($handle)}
  </div>
  <slot />
{/if}
