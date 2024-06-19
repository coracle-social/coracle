<script lang="ts">
  import {isCommunityAddress} from "@welshman/util"
  import Chip from "src/partials/Chip.svelte"
  import GroupCircle from "src/app/shared/GroupCircle.svelte"
  import GroupAbout from "src/app/shared/GroupAbout.svelte"
  import GroupName from "src/app/shared/GroupName.svelte"
  import {deriveGroupMeta} from "src/engine"

  export let address
  export let hideAbout = false

  const meta = deriveGroupMeta(address)
</script>

<div class="flex gap-4 text-neutral-100">
  <GroupCircle {address} class="h-8 w-8" />
  <div class="flex min-w-0 flex-grow flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <div class="flex items-center">
        <GroupName class="text-2xl" {address} />
        <Chip class="scale-75 border-neutral-200 text-neutral-200">
          {#if isCommunityAddress(address)}
            <i class="fa fa-unlock" />
            Open
          {:else}
            <i class="fa fa-lock" />
            Closed
          {/if}
        </Chip>
      </div>
      <slot name="actions" class="hidden xs:block" />
    </div>
    {#if !hideAbout && $meta?.about}
      <GroupAbout {address} />
    {/if}
  </div>
</div>
