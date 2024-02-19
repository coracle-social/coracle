<script lang="ts">
  import {toNostrURI} from "paravel"
  import {nsecEncode} from "src/util/nostr"
  import Popover from "src/partials/Popover.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import {groups, deriveAdminKeyForGroup, getGroupNaddr} from "src/engine"

  export let address

  const group = groups.key(address)
  const adminKey = deriveAdminKeyForGroup(address)

  const createInvite = () =>
    router.at("invites/create").qp({initialGroupAddress: address}).open()
</script>

<h1 class="staatliches text-2xl">Details</h1>
<CopyValue label="Group ID" value={address} />
<CopyValue label="Link" value={toNostrURI(getGroupNaddr($group))} />
{#if $adminKey}
  <CopyValue isPassword label="Admin key" value={$adminKey.privkey} encode={nsecEncode}>
    <div slot="label" class="flex gap-2">
      <span>Admin Key</span>
      <Popover triggerType="mouseenter">
        <i slot="trigger" class="fa fa-info-circle cursor-pointer" />
        <span slot="tooltip">This is your group administration password. Keep it secret!</span>
      </Popover>
    </div>
  </CopyValue>
{/if}
<Anchor button on:click={createInvite}>Create invite link</Anchor>
