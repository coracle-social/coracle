<script lang="ts">
  import {makeTagFeed} from "@welshman/feeds"
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/util/router"
  import {makeFeed} from 'src/domain'

  export let value

  const feed = makeFeed({definition: makeTagFeed("#t", value)})

  const onClick = () => router.at('notes').cx({feed}).push()
</script>

<Anchor modal underline on:click={onClick}>
  #{value}
</Anchor>
