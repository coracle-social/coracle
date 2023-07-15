<script lang="ts">
  import {defaultTo} from "ramda"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import {directory} from "src/app/engine"

  export let value

  const {pubkey} = value
  const profile = directory.profiles.key(pubkey).derived(defaultTo({pubkey}))
  const openPerson = () => modal.push({type: "person/feed", pubkey})
</script>

@<Anchor class="underline" killEvent on:click={openPerson}>
  {directory.displayProfile($profile)}
</Anchor>
