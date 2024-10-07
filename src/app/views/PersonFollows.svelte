<script lang="ts">
  import {getListTagValues} from "@welshman/util"
  import {deriveFollows} from "@welshman/app"
  import PersonList from "src/app/shared/PersonList.svelte"

  export let pubkey

  const follows = deriveFollows(pubkey)
</script>

<PersonList pubkeys={getListTagValues("p", $follows)} />
