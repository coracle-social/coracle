<script lang="ts">
  import {displayPerson} from "src/util/nostr"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import {getPersonWithFallback} from "src/agent/db"

  export let value

  const openPerson = () => modal.push({type: "person/feed", pubkey: value.pubkey})
</script>

@<Anchor class="underline" killEvent on:click={openPerson}>
  {displayPerson(getPersonWithFallback(value.pubkey))}
</Anchor>
