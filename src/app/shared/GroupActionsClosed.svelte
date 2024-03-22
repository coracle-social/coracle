<script lang="ts">
  import Modal from "src/partials/Modal.svelte"
  import Content from "src/partials/Content.svelte"
  import Field from "src/partials/Field.svelte"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {router} from "src/app/router"
  import {
    signer,
    session,
    GroupAccess,
    deriveAdminKeyForGroup,
    publishGroupExitRequest,
    publishGroupEntryRequest,
    deriveGroupStatus,
    resetGroupAccess,
  } from "src/engine"

  export let address
  export let claim = ""

  const adminKey = deriveAdminKeyForGroup(address)
  const status = deriveGroupStatus(address)

  let actions = []

  $: {
    actions = []

    actions.push({
      onClick: () => router.at("invite/create").qp({initialGroupAddress: address}).open(),
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
        onClick: () => router.at("groups").of(address).at("delete").open(),
        label: "Delete",
        icon: "trash",
      })

      actions.push({
        onClick: () => router.at("groups").of(address).at("rotate").open(),
        label: "Membership",
        icon: "rotate",
      })
    }

    actions.push({
      onClick: () => router.at("groups").of(address).at("info").open(),
      label: "Details",
      icon: "info",
    })
  }

  let showClaim

  const startJoin = () => {
    showClaim = true
  }

  const cancelJoin = () => {
    showClaim = false
  }

  const confirmJoin = () => {
    publishGroupEntryRequest(address, claim)
    claim = ""
    showClaim = false
  }

  const clear = () => resetGroupAccess(address)

  const leave = () => publishGroupExitRequest(address)
</script>

<div class="flex items-center gap-3" on:click|stopPropagation>
  {#if $session && $signer.isEnabled()}
    {#if !$status.access}
      <Popover triggerType="mouseenter">
        <div slot="trigger" class="w-6 text-center">
          <i class="fa fa-right-to-bracket cursor-pointer" on:click={startJoin} />
        </div>
        <div slot="tooltip">Join</div>
      </Popover>
    {:else if $status.access === GroupAccess.Requested}
      <Popover triggerType="mouseenter">
        <div slot="trigger" class="w-6 text-center">
          <i class="fa fa-hourglass cursor-pointer" />
        </div>
        <div slot="tooltip">Access Pending</div>
      </Popover>
    {:else if $status.access === GroupAccess.Granted}
      <Popover triggerType="mouseenter">
        <div slot="trigger" class="w-6 text-center">
          <i class="fa fa-right-from-bracket cursor-pointer" on:click={leave} />
        </div>
        <div slot="tooltip">Leave</div>
      </Popover>
    {:else if $status.access === GroupAccess.Revoked}
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

{#if showClaim}
  <Modal onEscape={cancelJoin}>
    <Content size="lg">
      <p>If you have an invite code, you can enter it below.</p>
      <Field label="Invite code">
        <Input bind:value={claim} />
      </Field>
      <div class="flex justify-center gap-2">
        <Anchor button on:click={cancelJoin}>Cancel</Anchor>
        <Anchor button accent on:click={confirmJoin}>Request access</Anchor>
      </div>
    </Content>
  </Modal>
{/if}
