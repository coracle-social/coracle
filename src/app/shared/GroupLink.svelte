<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/util/router"
  import {displayGroupMeta} from "src/domain"
  import {deriveGroupMeta, loadGroups} from "src/engine"

  export let address

  const meta = deriveGroupMeta(address)
  const path = router.at("groups").of(address).at("notes").toString()

  loadGroups([address])
</script>

<span class={$$props.class}>
  <Anchor modal underline href={path}>
    {displayGroupMeta($meta)}
  </Anchor>
</span>
