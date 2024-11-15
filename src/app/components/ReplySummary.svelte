<script lang="ts">
  import {onMount} from "svelte"
  import {deriveEvents} from "@welshman/store"
  import {repository, load} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import {COMMENT} from "@app/state"

  export let event
  export let relays: string[] = []

  const filters = [{kinds: [COMMENT], "#E": [event.id]}]
  const replies = deriveEvents(repository, {filters})

  onMount(() => {
    load({relays, filters})
  })
</script>

{#if $replies.length > 0}
  <button type="button" on:click class="flex-inline btn btn-neutral btn-xs gap-1 rounded-full">
    <Icon icon="reply" />
    {$replies.length}
  </button>
{/if}
