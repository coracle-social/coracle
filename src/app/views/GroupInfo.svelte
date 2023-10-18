<script lang="ts">
  import {toNostrURI} from "paravel"
  import Content from "src/partials/Content.svelte"
  import Popover from "src/partials/Popover.svelte"
  import CopyValue from "src/partials/CopyValue.svelte"
  import {groups, deriveAdminKeyForGroup, getGroupNaddr} from "src/engine"

  export let address

  const group = groups.key(address)
  const adminKey = deriveAdminKeyForGroup(address)
</script>

<Content>
  <h1 class="staatliches text-2xl">Details</h1>
  <CopyValue label="Link" value={toNostrURI(getGroupNaddr($group))} />
  {#if $adminKey}
    <CopyValue isPassword label="Admin key" value={$adminKey.privkey}>
      <div slot="label" class="flex gap-2">
        <span>Admin Key</span>
        <Popover triggerType="mouseenter">
          <i slot="trigger" class="fa fa-info-circle cursor-pointer" />
          <span slot="tooltip">This is your group administration password. Keep it secret!</span>
        </Popover>
      </div>
    </CopyValue>
  {/if}
</Content>
