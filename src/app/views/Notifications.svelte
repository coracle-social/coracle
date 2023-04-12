<script>
  import {pluck, reverse, max, last, sortBy, assoc} from "ramda"
  import {onMount} from "svelte"
  import {fly} from "svelte/transition"
  import {now, timedelta, createScroller} from "src/util/misc"
  import {findReplyId} from "src/util/nostr"
  import Spinner from "src/partials/Spinner.svelte"
  import Content from "src/partials/Content.svelte"
  import Notification from "src/app/views/Notification.svelte"
  import {watch} from "src/agent/db"
  import user from "src/agent/user"
  import {userEvents} from "src/agent/db"
  import {lastChecked} from "src/app/state"

  let limit = 0
  let events = null

  const prevChecked = $lastChecked.notifications || 0
  const notifications = watch("notifications", t => {
    lastChecked.update(assoc("notifications", now()))

    // Sort by rounded timestamp so we can group reactions to the same parent
    return reverse(
      sortBy(
        e => Math.round(e.created_at / timedelta(1, "hour")).toString() + findReplyId(e),
        user.applyMutes(t.all())
      )
    )
  })

  // Group notifications so we're only showing the parent once per chunk
  $: events = $notifications
    .slice(0, limit)
    .map(e => [e, findReplyId(e)])
    .filter(([e, ref]) => userEvents.get(ref)?.kind === 1)
    .reduce((r, [e, ref]) => {
      const prev = last(r)
      const prevTimestamp = pluck("created_at", prev?.notifications || []).reduce(max, 0)

      if (ref && prev?.ref === ref) {
        prev.notifications.push(e)
      } else {
        r = r.concat({
          ref,
          key: e.id,
          notifications: [e],
          showLine: e.created_at < prevChecked && prevTimestamp >= prevChecked,
        })
      }

      return r
    }, [])

  onMount(() => {
    document.title = "Notifications"

    return createScroller(async () => {
      limit += 50
    })
  })
</script>

{#if events}
  <Content>
    {#each events as event (event.key)}
      <div in:fly={{y: 20}}>
        <Notification {event} />
      </div>
      {#if event.showLine}
        <div class="flex items-center gap-4">
          <small class="whitespace-nowrap text-gray-1">Older notifications</small>
          <div class="h-px w-full bg-gray-6" />
        </div>
      {/if}
    {:else}
      <Content size="lg" class="text-center">No notifications found - check back later!</Content>
    {/each}
  </Content>
{:else}
  <Spinner />
{/if}
