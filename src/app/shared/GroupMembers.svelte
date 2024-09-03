<script lang="ts">
  import {COMMUNITIES} from "@welshman/util"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import GroupMember from "src/app/shared/GroupMember.svelte"
  import {load, deriveGroup, communityListsByAddress} from "src/engine"

  export let address

  const group = deriveGroup(address)
  const filters = [{kinds: [COMMUNITIES], "#a": [address]}]

  $: members =
    $group.members || $communityListsByAddress.get(address)?.map(l => l.event.pubkey) || []

  load({filters, skipCache: true})
</script>

<FlexColumn>
  {#each members as pubkey (pubkey)}
    <GroupMember {address} {pubkey} />
  {:else}
    <p class="text-center py-12">No members found.</p>
  {/each}
</FlexColumn>
