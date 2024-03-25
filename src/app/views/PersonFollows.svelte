<script lang="ts">
  import {onMount} from "svelte"
  import PersonList from "src/app/shared/PersonList.svelte"
  import {derivePerson, loadPubkeys, getFollowedPubkeys} from "src/engine"

  export let pubkey

  const pubkeys = derivePerson(pubkey).derived(getFollowedPubkeys)

  onMount(() => {
    loadPubkeys($pubkeys)
  })
</script>

<PersonList pubkeys={$pubkeys} />
