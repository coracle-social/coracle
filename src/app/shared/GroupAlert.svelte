<script lang="ts">
  import {formatTimestamp} from 'src/util/misc'
  import Card from "src/partials/Card.svelte"
  import Chip from "src/partials/Chip.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import GroupCircle from "src/app/shared/GroupCircle.svelte"
  import GroupName from "src/app/shared/GroupName.svelte"
  import {router} from "src/app/router"

  export let address
  export let alert
</script>

<Card interactive>
  <Content>
    <div class="flex justify-between">
      <p class="text-2xl">
        {#if alert.type === "exit"}
          Access revoked
        {:else if alert.type === "invite"}
          Group invitation
        {/if}
      </p>
      <small class="text-lighter">
        {formatTimestamp(alert.created_at)}
      </small>
    </div>
    <p>
      The admin of
      <Anchor modal href={router.at('groups').of(address).at('notes').toString()}>
        <Chip class="mx-1 relative top-px">
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
      <p class="border-l-2 border-solid border-mid pl-2">
        "{alert.content}"
      </p>
    {/if}
  </Content>
</Card>
