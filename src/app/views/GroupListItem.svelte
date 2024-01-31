<script>
  import {ellipsize} from "hurdak"
  import Chip from "src/partials/Chip.svelte"
  import Card from "src/partials/Card.svelte"
  import GroupCircle from "src/app/shared/GroupCircle.svelte"
  import {displayGroup} from "src/engine"
  import {router} from "src/app/router"

  export let group

  const enter = () => router.at("groups").of(group.address).at("notes").push()
</script>

<Card interactive on:click={enter} class="flex gap-4">
  <GroupCircle class="h-14 w-14" address={group.address} />
  <div class="flex min-w-0 flex-grow flex-col justify-start gap-1">
    <div class="flex gap-2 justify-between">
      <h2 class="text-xl font-bold">
        {displayGroup(group)}
      </h2>
      {#if group.address.startsWith('34550:')}
        <Chip class="text-lighter text-sm"><i class="fa fa-unlock" /> Open</Chip>
      {/if}
      {#if group.address.startsWith('35834:')}
        <Chip class="text-lighter text-sm"><i class="fa fa-lock" /> Closed</Chip>
      {/if}
    </div>
    {#if group.description}
      <p class="text-start text-lightest">
        {ellipsize(group.description, 300)}
      </p>
    {/if}
  </div>
</Card>
