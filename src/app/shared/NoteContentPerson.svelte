<script lang="ts">
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import {derivePerson, displayPerson} from "src/engine"

  export let value

  const {pubkey} = value
  const person = derivePerson(pubkey)
  const openPerson = () => modal.push({type: "person/detail", pubkey})
</script>

@<Anchor class="underline" killEvent on:click={openPerson}>
  {displayPerson($person)}
</Anchor>
