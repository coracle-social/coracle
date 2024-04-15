<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/util/router"
  import {deriveGroup, displayGroup, loadGroups} from "src/engine"

  export let address

  const group = deriveGroup(address)
  const path = router.at("groups").of(address).at("notes").toString()

  loadGroups([address])
</script>

<span class={$$props.class}>
  <Anchor modal underline href={path}>
    {displayGroup($group)}
  </Anchor>
</span>
