<script lang="ts">
  import GroupCircle from "src/app/shared/GroupCircle.svelte"
  import GroupAbout from "src/app/shared/GroupAbout.svelte"
  import GroupName from "src/app/shared/GroupName.svelte"
  import {groups} from "src/engine"

  export let address

  const group = groups.key(address)
</script>

<div class="flex gap-4 text-gray-1">
  <GroupCircle {address} class="h-8 w-8" />
  <div class="flex min-w-0 flex-grow flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <GroupName class="text-2xl" {address} />
      <slot name="actions" class="hidden xs:block" />
    </div>
    {#if $group?.description}
      <GroupAbout {address} />
    {/if}
  </div>
</div>
