<script>
  import {filter, slice, pluck, reverse, max, last, sortBy} from "ramda"
  import {onMount} from "svelte"
  import {doPipe} from "hurdak/lib/hurdak"
  import {fly} from "src/util/transition"
  import {navigate} from "svelte-routing"
  import {
    now,
    batch,
    timedelta,
    formatTimestampAsDate,
    formatTimestampAsLocalISODate,
    createScroller,
  } from "src/util/misc"
  import {findReplyId, noteKinds} from "src/util/nostr"
  import Spinner from "src/partials/Spinner.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Content from "src/partials/Content.svelte"
  import Notification from "src/app/views/Notification.svelte"
  import {ENABLE_ZAPS, Events, PubkeyLoader, Keys, User, Network, Alerts} from "src/app/engine"

  const lastChecked = Alerts.lastChecked.get()
  const tabs = ["Mentions & Replies", "Reactions"]

  export let activeTab = tabs[0]

  let limit = 0
  let events = null

  const notifications = Alerts.events.derived($events => {
    // As long as we're on the page, don't show a notification
    Alerts.lastChecked.set(now())

    // Sort by hour so we can group clustered reactions to the same parent
    return reverse(
      sortBy(
        e => formatTimestampAsLocalISODate(e.created_at).slice(0, 13) + findReplyId(e),
        User.applyMutes($events)
      )
    )
  })

  // Group notifications so we're only showing the parent once per chunk
  $: events = sortBy(
    ({notifications}) => -notifications.reduce((a, b) => Math.max(a, b.created_at), 0),
    $notifications
      .slice(0, limit)
      .map(e => [e, Events.cache.key(findReplyId(e)).get()])
      .filter(([e, ref]) => {
        if (ref && !noteKinds.includes(ref.kind)) {
          return false
        }

        if (activeTab === tabs[0]) {
          return noteKinds.includes(e.kind)
        } else {
          return [7, 9735].includes(e.kind) && ref
        }
      })
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
            created_at: e.created_at,
            dateDisplay: formatTimestampAsDate(e.created_at),
            showLine: e.created_at < lastChecked && prevTimestamp >= lastChecked,
          })
        }

        return r
      }, [])
  )

  const setActiveTab = tab => navigate(`/notifications/${tab}`)

  const getLineText = i => {
    const event = events[i]
    const prev = events[i - 1]

    if (prev?.dateDisplay !== event.dateDisplay) {
      return event.dateDisplay
    }
  }

  onMount(() => {
    document.title = "Notifications"

    const pubkey = Keys.pubkey.get()
    const since = lastChecked - timedelta(30, "days")
    const reactionKinds = ENABLE_ZAPS ? [7, 9735] : [7]
    const eventIds = doPipe(Events.cache.get(), [
      filter(e => noteKinds.includes(e.kind)),
      sortBy(e => -e.created_at),
      slice(0, 256),
      pluck("id"),
    ])

    const sub = Network.subscribe({
      relays: User.getRelayUrls("read"),
      filter: [
        {kinds: noteKinds.concat(reactionKinds), "#p": [pubkey], since},
        {kinds: noteKinds.concat(reactionKinds), "#e": eventIds, since},
      ],
      onEvent: batch(1000, events => {
        PubkeyLoader.load(pluck("pubkey", events))
      }),
    })

    const scroller = createScroller(async () => {
      limit += 50
    })

    return () => {
      sub.close()
      scroller.stop()
    }
  })
</script>

{#if events}
  <Content>
    <Tabs {tabs} {activeTab} {setActiveTab} />
    {#each events as event, i (event.key)}
      {@const lineText = getLineText(i)}
      {#if lineText}
        <div class="flex items-center gap-4">
          <small class="whitespace-nowrap text-gray-1">{lineText}</small>
          <div class="h-px w-full bg-gray-6" />
        </div>
      {/if}
      <div in:fly={{y: 20}}>
        <Notification {event} />
      </div>
    {:else}
      <Content size="lg" class="text-center">No notifications found - check back later!</Content>
    {/each}
  </Content>
{:else}
  <Spinner />
{/if}
