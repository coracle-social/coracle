<script>
  import {ellipsize} from "hurdak"
  import {derived} from "svelte/store"
  import {remove, intersection} from "@welshman/lib"
  import {isGroupAddress, isCommunityAddress} from "@welshman/util"
  import {pubkey} from "@welshman/app"
  import Chip from "src/partials/Chip.svelte"
  import Card from "src/partials/Card.svelte"
  import GroupCircle from "src/app/shared/GroupCircle.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import {router} from "src/app/util/router"
  import {displayGroupMeta} from "src/domain"
  import {deriveGroupMeta, userFollows, communityListsByAddress} from "src/engine"

  export let address
  export let modal = false

  const meta = deriveGroupMeta(address)
  const members = derived(communityListsByAddress, $m => {
    const allMembers = $m.get(address)?.map(l => l.event.pubkey) || []
    const otherMembers = remove($pubkey, allMembers)
    const followMembers = intersection(otherMembers, Array.from($userFollows))

    return followMembers
  })

  const enter = () => {
    const route = router.at("groups").of(address).at("notes")

    if (modal) {
      route.open()
    } else {
      route.push()
    }
  }
</script>

<Card interactive on:click={enter} class="flex gap-4">
  <GroupCircle class="h-14 w-14" {address} />
  <div class="flex min-w-0 flex-grow flex-col justify-start gap-1">
    <div class="flex justify-between gap-2">
      <h2 class="text-xl font-bold">
        {displayGroupMeta($meta)}
      </h2>
      <slot name="actions">
        {#if isCommunityAddress(address)}
          <Chip class="text-sm text-neutral-200"><i class="fa fa-unlock" /> Open</Chip>
        {/if}
        {#if isGroupAddress(address)}
          <Chip class="text-sm text-neutral-200"><i class="fa fa-lock" /> Closed</Chip>
        {/if}
      </slot>
    </div>
    {#if $meta?.about}
      <p class="overflow-hidden text-ellipsis text-start text-neutral-100">
        {ellipsize($meta.about, 300)}
      </p>
    {/if}
    {#if $members.length > 0}
      <div class="pt-1">
        <PersonCircles class="h-6 w-6" pubkeys={$members.slice(0, 20)} />
      </div>
    {/if}
  </div>
</Card>
