<script>
  import Feed from "src/app/shared/Feed.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {Nip65, Settings} from "src/app/engine"

  export let label
  export let hints
  export let ids

  const limit = Settings.getSetting("relay_limit")
  const relays = Nip65.selectHints(limit, hints)
  const filter = {ids}
</script>

<Content>
  <Heading>{label}</Heading>
  <Feed invertColors {relays} {filter} />
</Content>
