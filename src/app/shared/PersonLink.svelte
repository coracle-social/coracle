<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/util/router"
  import {displayPerson, derivePerson, loadPubkeys} from "src/engine"

  export let pubkey

  const person = derivePerson(pubkey)
  const path = router.at("people").of(pubkey).toString()

  loadPubkeys([pubkey])
</script>

<Anchor modal class={$$props.class} href={path}>
  @<span class="underline">{displayPerson($person)}</span>
</Anchor>
