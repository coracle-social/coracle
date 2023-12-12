<script lang="ts">
  import Feed from "src/app/shared/Feed.svelte"
  import Heading from "src/partials/Heading.svelte"
  import TopicActions from "src/app/shared/TopicActions.svelte"

  export let topic
</script>

<div class="flex justify-between gap-2">
  <Heading>#{topic}</Heading>
  <div class="pt-5">
    <TopicActions {topic} />
  </div>
</div>
<Feed filter={{kinds: [1], "#t": [topic]}} />
