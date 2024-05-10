<script lang="ts">
  import {makeIntersectionFeed, makeScopeFeed, Scope} from "@welshman/feeds"
  import {makeFeed} from "src/domain"
  import FeedForm from "src/app/shared/FeedForm.svelte"
  import {router} from "src/app/util"

  const feed = makeFeed({definition: makeIntersectionFeed(makeScopeFeed(Scope.Follows))})

  const exit = () => router.clearModals()
</script>

<FeedForm showSave {feed} {exit} />
