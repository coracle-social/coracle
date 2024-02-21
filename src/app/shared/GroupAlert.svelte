<script lang="ts">
  import {formatTimestamp} from "src/util/misc"
  import Card from "src/partials/Card.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import GroupCircle from "src/app/shared/GroupCircle.svelte"
  import GroupName from "src/app/shared/GroupName.svelte"
  import {router} from "src/app/router"

  export let address
  export let alert
</script>

<Card interactive>
  <FlexColumn>
    <div class="flex justify-between">
      <p class="text-2xl">
        {#if alert.type === "exit"}
          Access revoked
        {:else if alert.type === "invite"}
          Group invitation
        {/if}
      </p>
      <span class="text-sm">
        {formatTimestamp(alert.created_at)}
      </span>
    </div>
    <p>
      The admin of
      <Anchor modal href={router.at("groups").of(address).at("notes").toString()}>
        <Chip class="relative top-px mx-1">
          <GroupCircle {address} class="h-4 w-4" />
          <GroupName {address} />
        </Chip>
      </Anchor>
      has
      {#if alert.type === "exit"}
        removed you from the group.
      {:else if alert.type === "invite"}
        given you access to the group.
      {/if}
    </p>
    {#if alert.content}
      <p class="border-l-2 border-solid border-neutral-600 pl-2">
        "{alert.content}"
      </p>
    {/if}
  </FlexColumn>
</Card>
