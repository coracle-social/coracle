<script lang="ts">
  import Calendar from "src/app/shared/Calendar.svelte"
  import type {DynamicFilter} from "src/engine"
  import {env, FilterScope, loadGroupMessages} from "src/engine"

  const filter: DynamicFilter = {kinds: [31923]}

  if ($env.FORCE_GROUP) {
    filter["#a"] = [$env.FORCE_GROUP]
  } else {
    filter.scope = FilterScope.FollowsAndSelf
  }

  if ($env.FORCE_GROUP) {
    loadGroupMessages([$env.FORCE_GROUP])
  }
</script>

<Calendar filters={[filter]} />
