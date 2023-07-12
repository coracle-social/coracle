<script>
  import Feed from "src/app/shared/Feed.svelte"
  import Content from "src/partials/Content.svelte"
  import Heading from "src/partials/Heading.svelte"
  import TopicActions from "src/app/shared/TopicActions.svelte"
  import {routing, user} from "src/app/engine"

  export let topic

  const relays = routing.getPubkeyHints(3, user.getPubkey(), "read")
  const filter = {kinds: [1], "#t": [topic]}
</script>

<Content>
  <div class="flex justify-between gap-2">
    <Heading>#{topic}</Heading>
    <div class="pt-5">
      <TopicActions {topic} />
    </div>
  </div>
  <Feed {relays} {filter} />
</Content>
