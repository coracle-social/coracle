<script lang="ts">
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import GroupMember from "src/app/shared/GroupMember.svelte"
  import {deriveGroup} from 'src/engine'

  export let address

  const group = deriveGroup(address)
</script>

<FlexColumn>
  {#each $group.members || [] as pubkey (pubkey)}
    <GroupMember {address} {pubkey} />
  {:else}
    <p class="text-center py-12">No members found.</p>
  {/each}
</FlexColumn>
