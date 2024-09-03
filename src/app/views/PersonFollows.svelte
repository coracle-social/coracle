<script lang="ts">
  import {getListValues} from "@welshman/util"
  import {deriveFollows} from "@welshman/app"
  import PersonList from "src/app/shared/PersonList.svelte"
  import {loadPubkeys} from "src/engine"

  export let pubkey

  const follows = deriveFollows(pubkey)

  $: pubkeys = getListValues("p", $follows)

  $: {
    loadPubkeys(pubkeys)
  }
</script>

<PersonList {pubkeys} />
