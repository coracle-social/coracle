<script lang="ts">
  import {defaultTo} from "ramda"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import {Directory} from "src/app/engine"

  export let value

  const {pubkey} = value
  const profile = Directory.profiles.key(pubkey).derived(defaultTo({pubkey}))
  const openPerson = () => modal.push({type: "person/detail", pubkey})
</script>

@<Anchor class="underline" killEvent on:click={openPerson}>
  {Directory.displayProfile($profile)}
</Anchor>
