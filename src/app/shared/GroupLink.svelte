<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/router"
  import {groups, displayGroup} from 'src/engine'

  export let address

  const path = router.at("groups").of(address).at("notes").toString()
</script>

<span class={$$props.class}>
  +<Anchor modal theme="anchor" href={path}>
    {displayGroup(groups.key(address).get())}
  </Anchor>
</span>
