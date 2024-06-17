<script>
  import {ellipsize} from "hurdak"
  import {derived} from "svelte/store"
  import {remove, intersection} from "@welshman/lib"
  import Chip from "src/partials/Chip.svelte"
  import Card from "src/partials/Card.svelte"
  import GroupCircle from "src/app/shared/GroupCircle.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import {router} from "src/app/util/router"
  import {displayGroup, deriveGroup, userFollows, communityListsByAddress, pubkey} from "src/engine"

  export let address
  export let modal = false

  const group = deriveGroup(address)
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
        {displayGroup($group)}
      </h2>
      <slot name="actions">
        {#if address.startsWith("34550:")}
          <Chip class="text-sm text-neutral-200"><i class="fa fa-unlock" /> Open</Chip>
        {/if}
        {#if address.startsWith("35834:")}
          <Chip class="text-sm text-neutral-200"><i class="fa fa-lock" /> Closed</Chip>
        {/if}
      </slot>
    </div>
    {#if $group.meta?.about}
      <p class="text-start text-neutral-100">
        {ellipsize($group.meta.about, 300)}
      </p>
    {/if}
    {#if $members.length > 0}
      <div class="pt-1">
        <PersonCircles class="h-6 w-6" pubkeys={$members.slice(0, 20)} />
      </div>
    {/if}
  </div>
</Card>
