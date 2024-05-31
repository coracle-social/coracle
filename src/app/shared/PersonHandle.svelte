<script lang="ts">
  import cx from "classnames"
  import {nip19} from "nostr-tools"
  import {displayHandle} from "src/domain"
  import {deriveHandle} from "src/engine"

  export let pubkey

  const handle = deriveHandle(pubkey)
</script>

<div class={cx($$props.class, "overflow-hidden overflow-ellipsis opacity-75")}>
  {$handle ? displayHandle($handle) : nip19.npubEncode(pubkey)}
</div>
