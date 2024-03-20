<script lang="ts">
  import {toNostrURI} from "paravel"
  import {nsecEncode} from "src/util/nostr"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import {groups, deriveAdminKeyForGroup, getGroupNaddr} from "src/engine"
  import {router} from 'src/app/router'

  export let address

  const group = groups.key(address)
  const adminKey = deriveAdminKeyForGroup(address)

  const shareAdminKey = () => {
    popover?.hide()
    router.at('groups').of(address).at('invite-admin').open()
  }

  let popover
</script>

<h1 class="staatliches text-2xl">Details</h1>
<CopyValue label="Group ID" value={address} />
<CopyValue label="Link" value={toNostrURI(getGroupNaddr($group))} />
{#if $adminKey}
  <CopyValue isPassword label="Admin key" value={$adminKey.privkey} encode={nsecEncode}>
    <div slot="label" class="flex gap-2">
      <span>Admin Key</span>
      <Popover bind:instance={popover}>
        <i slot="trigger" class="fa fa-info-circle cursor-pointer" />
        <div slot="tooltip">
          <FlexColumn>
            <p>
              This is your group administration password. Keep it secret!
            </p>
            <p>
              Click
              <Anchor modal underline on:click={shareAdminKey}>
                here
              </Anchor>
              to share this key with another user. This will give them
              <b>complete</b> control over this group.
            </p>
          </FlexColumn>
        </div>
      </Popover>
    </div>
  </CopyValue>
{/if}
