<script lang="ts">
  import {makeTagFeed} from "@welshman/feeds"
  import Feeds from "src/app/views/Feeds.svelte"
  import {makeFeed} from "src/domain"

  export let feed = null
  export let topic = null
</script>

<Feeds feed={topic ? makeFeed({definition: makeTagFeed("#t", topic)}) : feed} />
