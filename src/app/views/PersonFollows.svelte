<script lang="ts">
  import {getListTags, getPubkeyTagValues} from "@welshman/util"
  import {deriveFollowList} from "@welshman/app"
  import PersonList from "src/app/shared/PersonList.svelte"

  export let pubkey

  const follows = deriveFollowList(pubkey)
</script>

<PersonList pubkeys={getPubkeyTagValues(getListTags($follows))} />
