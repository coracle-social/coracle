<script lang="ts">
  import {groupBy, uniqBy} from "@welshman/lib"
  import {REACTION} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {pubkey, repository} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import {REPLY} from "@app/state"

  export let event

  const replies = deriveEvents(repository, {filters: [{kinds: [REPLY], "#E": [event.id]}]})
</script>

{#if $replies.length > 0}
  <div class="flex-inline btn btn-neutral btn-xs gap-1 rounded-full">
    <Icon icon="reply" />
    {$replies.length}
  </div>
{/if}
