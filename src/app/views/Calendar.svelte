<script lang="ts">
  import {identity} from "ramda"
  import {pubkey} from "@welshman/app"
  import Calendar from "src/app/shared/Calendar.svelte"
  import {userFollows} from "src/engine"

  const filter = {kinds: [31923], authors: [$pubkey, ...$userFollows].filter(identity)}
</script>

<Calendar {filter} />
