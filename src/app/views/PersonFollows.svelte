<script lang="ts">
  import {getListValues} from "@welshman/util"
  import {deriveFollows} from "@welshman/app"
  import PersonList from "src/app/shared/PersonList.svelte"

  export let pubkey

  const follows = deriveFollows(pubkey)
</script>

<PersonList pubkeys={getListValues("p", $follows)} />
