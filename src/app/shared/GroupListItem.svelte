<script>
  import {ellipsize} from "hurdak"
  import Chip from "src/partials/Chip.svelte"
  import Card from "src/partials/Card.svelte"
  import GroupCircle from "src/app/shared/GroupCircle.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import {router} from "src/app/util/router"
  import {displayGroup, deriveGroup, getWotGroupMembers} from "src/engine"

  export let address
  export let modal = false

  const group = deriveGroup(address)
  const members = getWotGroupMembers(address)

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
    {#if members.length > 0}
      <p class="mt-4 text-lg text-neutral-300">Members:</p>
      <PersonCircles pubkeys={members.slice(0, 20)} />
    {/if}
  </div>
</Card>
