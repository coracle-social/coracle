<script lang="ts">
  import {Scope, filterFeed} from "@coracle.social/feeds"
  import Calendar from "src/app/shared/Calendar.svelte"
  import {env, loadGroupMessages} from "src/engine"

  const feed = $env.FORCE_GROUP
    ? filterFeed({kinds: [31923], "#a": [$env.FORCE_GROUP]})
    : filterFeed({kinds: [31923], scopes: [Scope.Self, Scope.Follows]})

  if ($env.FORCE_GROUP) {
    loadGroupMessages([$env.FORCE_GROUP])
  }
</script>

<Calendar {feed} />
