<script lang="ts">
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import {directory} from "src/system"

  export let value

  const openPerson = () => modal.push({type: "person/feed", pubkey: value.pubkey})
</script>

@<Anchor class="underline" killEvent on:click={openPerson}>
  {directory.displayPubkey(value.pubkey)}
</Anchor>
