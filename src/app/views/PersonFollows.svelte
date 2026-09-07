<script lang="ts">
  import {FollowLists} from "@welshman/app"
  import {fromApp} from "src/engine/core"
  import PersonList from "src/app/shared/PersonList.svelte"

  export let pubkey

  const follows = fromApp($app => $app.use(FollowLists).one(pubkey))
</script>

<PersonList pubkeys={$follows?.pubkeys() || []} />
