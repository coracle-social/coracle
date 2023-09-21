<script lang="ts">
  import Feed from "src/app/shared/Feed.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {selectHints} from "src/engine"

  export let label
  export let hints
  export let ids
</script>

<Content>
  <Heading>{label}</Heading>
  <Feed invertColors relays={selectHints(hints)} filter={{ids}} />
</Content>
