<script lang="ts">
  import Feed from "src/app/shared/Feed.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {selectHints, getSetting} from "src/engine2"

  export let label
  export let hints
  export let ids

  const relays = selectHints(getSetting("relay_limit"), hints)
</script>

<Content>
  <Heading>{label}</Heading>
  <Feed invertColors {relays} filter={{ids}} />
</Content>
