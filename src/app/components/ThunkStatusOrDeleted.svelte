<script lang="ts">
  import type {TrustedEvent} from "@welshman/util"
  import {deriveIsDeleted} from "@welshman/store"
  import {thunks, repository} from "@welshman/app"
  import ThunkStatus from "@app/components/ThunkStatus.svelte"

  const {event}: {event: TrustedEvent} = $props()

  const thunk = $derived($thunks[event.id])
  const deleted = deriveIsDeleted(repository, event)
</script>

{#if $deleted}
  <div class="btn btn-error btn-xs rounded-full">Deleted</div>
{:else if thunk}
  <ThunkStatus {thunk} />
{/if}
