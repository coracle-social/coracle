<script lang="ts">
  import {ucFirst} from "hurdak"
  import Chip from "src/partials/Chip.svelte"
  import GroupCircle from "src/app/shared/GroupCircle.svelte"
  import GroupAbout from "src/app/shared/GroupAbout.svelte"
  import GroupName from "src/app/shared/GroupName.svelte"
  import {groups, deriveMembershipLevel, MembershipLevel, GroupAccess} from "src/engine"

  export let address

  const group = groups.key(address)
  const membershipLevel = deriveMembershipLevel(address)
</script>

<div class="flex gap-4 text-gray-1">
  <GroupCircle {address} class="h-8 w-8" />
  <div class="flex min-w-0 flex-grow flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center">
        <GroupName class="text-2xl" {address} />
        <Chip class="scale-75 border-gray-3 text-gray-3">
          <i
            class="fa"
            class:fa-lock={$membershipLevel === MembershipLevel.Private}
            class:fa-unlock={$membershipLevel === MembershipLevel.Public} />
          {ucFirst(String($membershipLevel || $group?.access || GroupAccess.Closed))}
        </Chip>
      </div>
      <slot name="actions" class="hidden xs:block" />
    </div>
    {#if $group?.description}
      <GroupAbout {address} />
    {/if}
  </div>
</div>
