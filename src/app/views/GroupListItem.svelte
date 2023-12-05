<script>
  import {ellipsize} from "hurdak"
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
    <h2 class="text-xl font-bold">
      {displayGroup(group)}
    </h2>
    {#if group.description}
      <p class="text-start text-gray-1">
        {ellipsize(group.description, 300)}
      </p>
    {/if}
  </div>
</Card>
