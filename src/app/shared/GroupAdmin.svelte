<script lang="ts">
  import {whereEq} from "ramda"
  import GroupRequest from "src/app/shared/GroupRequest.svelte"
  import {groupRequests} from 'src/engine'

  export let address

  const requests = groupRequests.derived(requests =>
    requests.filter(whereEq({group: address, resolved: false})),
  )
</script>

{#each $requests as request (request.id)}
  <GroupRequest {address} {request} />
{:else}
  <p class="text-center py-12">No action items found.</p>
{/each}
