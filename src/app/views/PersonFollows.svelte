<script lang="ts">
  import {onMount} from "svelte"
  import PersonList from "src/app/shared/PersonList.svelte"
  import {loadPubkeys, deriveFollows} from "src/engine"

  export let pubkey

  const pubkeys = deriveFollows(pubkey)

  onMount(() => {
    loadPubkeys(Array.from($pubkeys))
  })
</script>

<PersonList pubkeys={Array.from($pubkeys)} />
