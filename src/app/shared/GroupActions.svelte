<script lang="ts">
  import Popover from "src/partials/Popover.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {router} from "src/app/router"
  import {
    groups,
    deriveAdminKeyForGroup,
    leaveGroup,
    joinGroup,
    getGroupNaddr,
    deriveGroupStatus,
    deriveGroupAccess,
    resetMemberAccess,
    GroupAccess,
  } from "src/engine"

  export let address

  const group = groups.key(address)
  const adminKey = deriveAdminKeyForGroup(address)
  const access = deriveGroupAccess(address)
  const status = deriveGroupStatus(address)

  let actions = []

  $: {
    actions = []

    actions.push({
      onClick: () => router.at("qrcode").of(getGroupNaddr($group)).open(),
      label: "Share",
      icon: "share-nodes",
    })

    if ($adminKey) {
      actions.push({
        onClick: () => router.at("groups").of(address).at("edit").open(),
        label: "Edit",
        icon: "edit",
      })

      actions.push({
        onClick: () => router.at("groups").of(address).at("rotate").open(),
        label: "Rotate Keys",
        icon: "rotate",
      })

      actions.push({
        onClick: () => router.at("groups").of(address).at("info").open(),
        label: "Details",
        icon: "info",
      })
    }
  }

  const clear = () => resetMemberAccess(address)

  const leave = () => leaveGroup(address)

  const join = () => joinGroup(address)
</script>

<div class="flex items-center gap-3" on:click|stopPropagation>
  {#if !$adminKey}
    {#if $access === GroupAccess.Open}
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
    {:else if !$status.access}
      <Popover triggerType="mouseenter">
        <div slot="trigger" class="w-6 text-center">
          <i class="fa fa-right-to-bracket cursor-pointer" on:click={join} />
        </div>
        <div slot="tooltip">Join</div>
      </Popover>
    {:else if $status.access === "requested"}
      <Popover triggerType="mouseenter">
        <div slot="trigger" class="w-6 text-center">
          <i class="fa fa-hourglass cursor-pointer" />
        </div>
        <div slot="tooltip">Access Pending</div>
      </Popover>
    {:else if $status.access === "granted"}
      <Popover triggerType="mouseenter">
        <div slot="trigger" class="w-6 text-center">
          <i class="fa fa-right-from-bracket cursor-pointer" on:click={leave} />
        </div>
        <div slot="tooltip">Leave</div>
      </Popover>
    {:else if $status.access === "revoked"}
      <Popover triggerType="mouseenter">
        <div slot="trigger" class="w-6 text-center">
          <i class="fa fa-times cursor-pointer" on:click={clear} />
        </div>
        <div slot="tooltip">Access Revoked</div>
      </Popover>
    {/if}
  {/if}
  <OverflowMenu {actions} />
</div>
