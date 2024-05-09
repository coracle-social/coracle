<script lang="ts">
  import {makeIntersectionFeed, makeScopeFeed, Scope} from "@welshman/feeds"
  import {makeFeed} from "src/domain"
  import Anchor from "src/partials/Anchor.svelte"
  import FeedForm from "src/app/shared/FeedForm.svelte"
  import {router} from "src/app/util"

  const feed = makeFeed({definition: makeIntersectionFeed(makeScopeFeed(Scope.Follows))})

  const exit = () => router.pop()
</script>

<FeedForm {feed} onSave={exit}>
  <div slot="controls" let:save class="flex justify-between">
    <Anchor button on:click={exit}>Cancel</Anchor>
    <Anchor button accent on:click={save}>Save</Anchor>
  </div>
</FeedForm>
