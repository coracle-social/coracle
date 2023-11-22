<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/router"
  import {displayPubkey, loadPubkeys} from "src/engine"

  export let pubkey

  const path = router.at("people").of(pubkey).toString()

  loadPubkeys([pubkey])
</script>

<span class={$$props.class}>
  @<Anchor modal theme="anchor" href={path}>
    {displayPubkey(pubkey)}
  </Anchor>
</span>
