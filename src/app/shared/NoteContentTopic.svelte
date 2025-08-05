<script lang="ts">
  import {makeTagFeed} from "@welshman/feeds"
  import Button from "src/partials/Button.svelte"
  import {router} from "src/app/util/router"
  import {makeFeed} from "src/domain"

  export let value

  const feed = makeFeed({definition: makeTagFeed("#t", value)})

  const onClick = () => router.at("notes").cx({feed}).push()
</script>

<Button modal class="underline" on:click={onClick}>
  #{value}
</Button>
