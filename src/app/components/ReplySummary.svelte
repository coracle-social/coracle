<script lang="ts">
  import {deriveEvents} from "@welshman/store"
  import {repository} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import {COMMENT} from "@app/state"

  export let event

  const replies = deriveEvents(repository, {filters: [{kinds: [COMMENT], "#E": [event.id]}]})
</script>

{#if $replies.length > 0}
  <button type="button" on:click class="flex-inline btn btn-neutral btn-xs gap-1 rounded-full">
    <Icon icon="reply" />
    {$replies.length}
  </button>
{/if}
