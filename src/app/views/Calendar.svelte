<script lang="ts">
  import {Scope, feedFromFilter, intersectionFeed, kindFeed, scopeFeed} from "@welshman/feeds"
  import Calendar from "src/app/shared/Calendar.svelte"
  import {env, loadGroupMessages} from "src/engine"

  const feed = $env.FORCE_GROUP
    ? feedFromFilter({kinds: [31923], "#a": [$env.FORCE_GROUP]})
    : intersectionFeed(kindFeed(31923), scopeFeed(Scope.Self, Scope.Follows))

  if ($env.FORCE_GROUP) {
    loadGroupMessages([$env.FORCE_GROUP])
  }
</script>

<Calendar {feed} />
