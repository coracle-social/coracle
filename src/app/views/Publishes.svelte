<script lang="ts">
  import {pluralize, seconds} from "hurdak"
  import {assoc, now, remove, sortBy} from "@welshman/lib"
  import {LOCAL_RELAY_URL} from "@welshman/util"
  import {PublishStatus} from "@welshman/net"
  import Tile from "src/partials/Tile.svelte"
  import Subheading from "src/partials/Subheading.svelte"
  import PublishCard from "src/app/shared/PublishCard.svelte"
  import {thunks, type Thunk} from "@welshman/app"
  import {get} from "svelte/store"

  const hasStatus = (thunk: Thunk, statuses: PublishStatus[]) =>
    Object.values(get(thunk.status)).some(s => statuses.includes(s.status))

  $: recent = (Object.values($thunks) as Thunk[]).filter(
    t => t.event.created_at > now() - seconds(24, "hour"),
  )
  $: relays = new Set(
    remove(
      LOCAL_RELAY_URL,
      recent.flatMap(({request}) => request.relays),
    ),
  )
  $: success = recent.filter(t => hasStatus(t, [PublishStatus.Success]))
  $: pending = recent.filter(
    t => hasStatus(t, [PublishStatus.Pending]) && !hasStatus(t, [PublishStatus.Success]),
  )

  // If the page gets refreshed before pending finishes, it hangs. Set stuff to failed
  $: {
    for (const t of recent) {
      if (t.event.created_at < now() - seconds(1, "minute")) {
        for (const [url, s] of Object.entries(t.status)) {
          if (s.status === PublishStatus.Pending) {
            t.status.update(assoc(url, {status: PublishStatus.Failure, message: ""}))
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
{#each sortBy(t => -t.event.created_at, recent) as thunk (thunk.event.id)}
  <PublishCard {thunk} />
{/each}
