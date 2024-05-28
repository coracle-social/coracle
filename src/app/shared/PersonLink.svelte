<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/util/router"
  import {displayProfile} from "src/domain"
  import {deriveProfile, loadPubkeys} from "src/engine"

  export let pubkey

  const profile = deriveProfile(pubkey)
  const path = router.at("people").of(pubkey).toString()

  loadPubkeys([pubkey])
</script>

<Anchor modal class={$$props.class} href={path}>
  @<span class="underline">{displayProfile($profile)}</span>
</Anchor>
