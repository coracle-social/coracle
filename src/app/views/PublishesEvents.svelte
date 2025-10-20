<script lang="ts">
  import {call, uniqBy, ago, nthNe, nth, DAY, MINUTE, now, remove, sortBy} from "@welshman/lib"
  import {PublishStatus, LOCAL_RELAY_URL} from "@welshman/net"
  import {thunks} from "@welshman/app"
  import Tile from "src/partials/Tile.svelte"
  import PublishCard from "src/app/shared/PublishCard.svelte"
  import {pluralize} from "src/util/misc"

  $: recent = uniqBy(t => t.event.id, $thunks.filter(t => t.event.created_at > ago(DAY)))

  $: relays = new Set(
    remove(
      LOCAL_RELAY_URL,
      recent.flatMap(thunk => thunk.options.relays),
    ),
  )

  $: hud = call(() => {
    let pending = 0
    let success = 0

    for (const thunk of recent) {
      const statuses = Object.entries(thunk.results).filter(nthNe(0, LOCAL_RELAY_URL)).map(nth(1))

      if (statuses.includes(PublishStatus.Success)) {
        success += 1
      } else if (statuses.every(p => p === PublishStatus.Pending)) {
        pending += 1
      }
    }

    return {pending, success, failure: recent.length - pending - success}
  })

  // If the page gets refreshed before pending finishes, it hangs. Set stuff to failed
  $: {
    for (const t of recent) {
      if (t.event.created_at < now() - MINUTE) {
        for (const [url, {status}] of Object.entries(t.results)) {
          if (status === PublishStatus.Pending) {
            t.results[url].status = PublishStatus.Failure
          }
        }
      }
    }
  }
</script>

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
    <p class="text-lg sm:text-2xl">{hud.pending}</p>
    <span class="text-sm">Pending</span>
  </Tile>
  <Tile background>
    <p class="text-lg sm:text-2xl">{hud.success}</p>
    <span class="text-sm">Succeeded</span>
  </Tile>
  <Tile background>
    <p class="text-lg sm:text-2xl">{hud.failure}</p>
    <span class="text-sm">Failed</span>
  </Tile>
</div>
{#each sortBy(t => -t.event.created_at, recent) as thunk (thunk.event.id)}
  <PublishCard {thunk} />
{/each}
