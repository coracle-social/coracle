<script>
  import Feed from "src/app/shared/Feed.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import {sampleRelays, getUserReadRelays} from "src/agent/relays"

  export let topic
  const relays = sampleRelays(getUserReadRelays())
  const filter = [{kinds: [1], "#t": [topic.replace("#", "")]}]
</script>

<Content>
  <Heading class="text-center">{topic}</Heading>
  <Feed inModal {relays} {filter} />
</Content>
