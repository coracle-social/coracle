<script lang="ts">
  import {without} from "ramda"
  import Popover from "src/partials/Popover.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {router} from "src/app/router"
  import {
    session,
    pubkey,
    publishCommunitiesList,
    getGroupNaddr,
    deriveGroup,
    deriveGroupStatus,
    deriveAdminKeyForGroup,
    deriveUserCommunities,
  } from "src/engine"

  export let address

  const group = deriveGroup(address)
  const adminKey = deriveAdminKeyForGroup(address)
  const status = deriveGroupStatus(address)

  console.log($status)

  let actions = []

  $: {
    actions = []

    actions.push({
      onClick: () => router.at("qrcode").of(getGroupNaddr($group)).open(),
      label: "Share",
      icon: "share-nodes",
    })

    if ($group.pubkey === $pubkey || $adminKey) {
      actions.push({
        onClick: () => router.at("groups").of(address).at("edit").open(),
        label: "Edit",
        icon: "edit",
      })

      actions.push({
        onClick: () => router.at("groups").of(address).at("info").open(),
        label: "Details",
        icon: "info",
      })
    }
  }

  const join = () => publishCommunitiesList(deriveUserCommunities().get().concat(address))

  const leave = () => publishCommunitiesList(without([address], deriveUserCommunities().get()))
</script>

<div class="flex items-center gap-3" on:click|stopPropagation>
  {#if $session}
    {#if $status.joined}
      <Popover triggerType="mouseenter">
        <div slot="trigger" class="w-6 text-center">
          <i class="fa fa-right-from-bracket cursor-pointer" on:click={leave} />
        </div>
        <div slot="tooltip">Leave</div>
      </Popover>
    {:else}
      <Popover triggerType="mouseenter">
        <div slot="trigger" class="w-6 text-center">
          <i class="fa fa-right-to-bracket cursor-pointer" on:click={join} />
        </div>
        <div slot="tooltip">Join</div>
      </Popover>
    {/if}
  {/if}
  <OverflowMenu {actions} />
</div>
