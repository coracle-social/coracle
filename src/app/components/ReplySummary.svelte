<script lang="ts">
  import {deriveEvents} from "@welshman/store"
  import {repository} from "@welshman/app"
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
