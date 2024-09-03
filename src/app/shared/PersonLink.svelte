<script lang="ts">
  import {deriveProfileDisplay} from "@welshman/app"
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/util/router"
  import {loadPubkeys} from "src/engine"

  export let pubkey

  const path = router.at("people").of(pubkey).toString()
  const display = deriveProfileDisplay(pubkey)

  loadPubkeys([pubkey])
</script>

<Anchor modal stopPropagation class={$$props.class} href={path}>
  @<span class="underline">{$display}</span>
</Anchor>
