<script lang="ts">
  import cx from "classnames"
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/util/router"
  import {deriveProfileDisplay, loadPubkeys} from "src/engine"

  export let pubkey

  const path = router.at("people").of(pubkey).toString()
  const display = deriveProfileDisplay(pubkey)

  loadPubkeys([pubkey])
</script>

<Anchor modal stopPropagation class={cx("!no-underline", $$props.class)} href={path}>
  @<span class="underline">{$display}</span>
</Anchor>
