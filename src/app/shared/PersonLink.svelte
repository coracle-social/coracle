<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/router"
  import {displayPerson, derivePerson, loadPubkeys} from "src/engine"

  export let pubkey

  const person = derivePerson(pubkey)
  const path = router.at("people").of(pubkey).toString()

  loadPubkeys([pubkey])
</script>

<span class={$$props.class}>
  @<Anchor modal theme="anchor" href={path}>
    {displayPerson($person)}
  </Anchor>
</span>
