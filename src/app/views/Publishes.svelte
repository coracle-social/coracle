<script lang="ts">
  import {pluralize, seconds} from "hurdak"
  import {now, sortBy} from "@welshman/lib"
  import {PublishStatus} from "@welshman/net"
  import Tile from "src/partials/Tile.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import PublishCard from "src/app/shared/PublishCard.svelte"
  import type {PublishInfo} from "src/engine"
  import {publishes} from "src/engine"

  const hasStatus = (pub: PublishInfo, statuses: PublishStatus[]) =>
    Array.from(pub.status.values()).some(s => statuses.includes(s))

  $: recent = $publishes.filter(p => p.created_at > now() - seconds(24, "hour"))
  $: relays = new Set(recent.flatMap(({request}) => request.relays))
  $: success = recent.filter(p => hasStatus(p, [PublishStatus.Success]))
  $: pending = recent.filter(
    p => hasStatus(p, [PublishStatus.Pending]) && !hasStatus(p, [PublishStatus.Success]),
  )

  // If the page gets refreshed before pending finishes, it hangs. Set stuff to failed
  $: {
    for (const p of recent) {
      if (p.created_at < now() - seconds(1, "minute")) {
        for (const [url, status] of p.status.entries()) {
          if (status === PublishStatus.Pending) {
            p.status.set(url, PublishStatus.Failure)
          }
        }
      }
    }
  }
</script>

<Subheading>Published Events</Subheading>
<div class="grid grid-cols-4 justify-between gap-2 sm:grid-cols-5">
  <Tile background>
    <p class="text-lg sm:text-2xl">{recent.length}</p>
    <span class="text-sm">{pluralize(recent.length, "Event")}</span>
  </Tile>
  <Tile background>
    <p class="text-lg sm:text-2xl">{relays.size}</p>
    <span class="text-sm">{pluralize(relays.size, "Relay")}</span>
  </Tile>
  <Tile background lass="hidden sm:block">
    <p class="text-lg sm:text-2xl">{pending.length}</p>
    <span class="text-sm">Pending</span>
  </Tile>
  <Tile background>
    <p class="text-lg sm:text-2xl">{success.length}</p>
    <span class="text-sm">Succeeded</span>
  </Tile>
  <Tile background>
    <p class="text-lg sm:text-2xl">{recent.length - pending.length - success.length}</p>
    <span class="text-sm">Failed</span>
  </Tile>
</div>
{#each sortBy(p => -p.created_at, recent) as pub (pub.id)}
  <PublishCard {pub} />
{/each}
