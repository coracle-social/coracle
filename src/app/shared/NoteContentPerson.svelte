<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/router"
  import {derivePerson, displayPerson} from "src/engine"

  export let value

  const {pubkey} = value
  const person = derivePerson(pubkey)
</script>

@<Anchor modal class="underline" href={router.at("people").of(pubkey).toString()}>
  {displayPerson($person)}
</Anchor>
