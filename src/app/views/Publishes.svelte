<script lang="ts">
  import {pluralize, seconds} from "hurdak"
  import {now, sortBy} from "@coracle.social/lib"
  import {PublishStatus} from "@coracle.social/network"
  import Square from "src/partials/Square.svelte"
  import AltColor from "src/partials/AltColor.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import PublishCard from "src/app/shared/PublishCard.svelte"
  import type {PublishInfo} from "src/engine"
  import {publishes} from "src/engine"

  const hasStatus = (pub: PublishInfo, statuses: PublishStatus[]) =>
    Array.from(pub.status.values()).some(s => statuses.includes(s))

  $: recent = $publishes.filter(p => p.created_at > now() - seconds(24, "hour"))
  $: relays = new Set(recent.flatMap(({request}) => request.relays))
  $: pending = recent.filter(p => hasStatus(p, [PublishStatus.Pending]))
  $: success = recent.filter(p => hasStatus(p, [PublishStatus.Success]))
</script>

<Subheading>Published Events</Subheading>
<div class="grid grid-cols-4 justify-between gap-2 sm:grid-cols-5">
  <AltColor background class="rounded-xl">
    <Square class="flex aspect-square flex-grow flex-col">
      <p class="text-lg sm:text-2xl">{recent.length}</p>
      <span class="text-sm">{pluralize(recent.length, "Event")}</span>
    </Square>
  </AltColor>
  <AltColor background class="rounded-xl">
    <Square class="flex aspect-square flex-grow flex-col">
      <p class="text-lg sm:text-2xl">{relays.size}</p>
      <span class="text-sm">{pluralize(relays.size, "Relay")}</span>
    </Square>
  </AltColor>
  <AltColor background class="hidden rounded-xl sm:block">
    <Square class="flexflex-col aspect-square flex-grow">
      <p class="text-lg sm:text-2xl">{pending.length}</p>
      <span class="text-sm">Pending</span>
    </Square>
  </AltColor>
  <AltColor background class="rounded-xl">
    <Square class="flex aspect-square flex-grow flex-col">
      <p class="text-lg sm:text-2xl">{success.length}</p>
      <span class="text-sm">Succeeded</span>
    </Square>
  </AltColor>
  <AltColor background class="rounded-xl">
    <Square class="flex aspect-square flex-grow flex-col">
      <p class="text-lg sm:text-2xl">{recent.length - pending.length - success.length}</p>
      <span class="text-sm">Failed</span>
    </Square>
  </AltColor>
</div>
{#each sortBy(p => -p.created_at, recent) as pub (pub.id)}
  <PublishCard {pub} />
{/each}
