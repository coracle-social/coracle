<script>
  import {propEq, uniqBy, prop, sortBy} from 'ramda'
  import {onMount, onDestroy} from 'svelte'
  import {fly} from 'svelte/transition'
  import {alerts} from 'src/state/app'
  import {findReply} from 'src/util/nostr'
  import relay, {people, user} from 'src/relay'
  import {now, timedelta, createScroller, Cursor, getLastSync} from 'src/util/misc'
  import Spinner from "src/partials/Spinner.svelte"
  import Note from 'src/partials/Note.svelte'
  import Like from 'src/partials/Like.svelte'

  let sub
  let scroller
  let notes
  let limit = 0

  const cursor = new Cursor(
    getLastSync('routes/Alerts'),
    timedelta(1, 'days')
  )

  onMount(async () => {
    sub = await relay.pool.listenForEvents(
      'routes/Alerts',
      [{kinds: [1, 5, 7], '#p': [$user.pubkey], since: cursor.since}],
      onEvent
    )

    scroller = createScroller(async () => {
      limit += 20

      notes = relay.lq(() => loadNotes(limit))
    })
  })

  onDestroy(() => {
    sub?.unsub()
    scroller?.stop()
  })

  const onEvent = e => {
    if (e.kind === 1) {
      relay.loadNoteContext(e)
    }

    if (e.kind === 7) {
      const replyId = findReply(e)

      if (replyId) {
        relay.getOrLoadNote(replyId)
      }
    }

    alerts.set({since: now()})
  }

  const loadNotes = async limit => {
    const events = await relay.filterAlerts($user, limit + 1)
    const notes = await relay.annotateChunk(events.filter(propEq('kind', 1)))
    const reactions = await Promise.all(
      events
        .filter(e => e.kind === 7)
        .map(async e => ({
          ...e,
          person: $people[e.pubkey] || {pubkey: e.pubkey},
          parent: await relay.findNote(findReply(e)),
        }))
    )

    if (events.length <= limit) {
      const [since, until] = cursor.step()

      relay.pool.loadEvents(
        [{kinds: [1, 7], '#p': [$user.pubkey], since, until}],
        onEvent
      )
    } else {
      setTimeout(scroller.check, 300)
    }

    // Combine likes of a single note
    const likesById = {}
    const alerts = notes.filter(e => e.pubkey !== $user.pubkey)
    for (const reaction of reactions.filter(prop('parent'))) {
      if (!likesById[reaction.parent.id]) {
        likesById[reaction.parent.id] = {...reaction.parent, people: []}
      }

      likesById[reaction.parent.id].people.push(reaction.person)
    }

    return sortBy(
      e => -e.created_at,
      uniqBy(prop('id'), alerts.concat(Object.values(likesById)))
    )
  }

  alerts.set({since: now()})
</script>

<ul class="py-4 flex flex-col gap-2 max-w-xl m-auto">
  {#each ($notes || []) as e (e.id)}
  {#if e.people}
  <li in:fly={{y: 20}}><Like note={e} /></li>
  {:else}
  <li in:fly={{y: 20}}><Note note={e} /></li>
  {/if}
  {/each}
</ul>

{#if $notes?.length === 0}
<div in:fly={{y: 20}} class="flex w-full justify-center items-center py-16">
  <div class="text-center max-w-md">
    No recent activity found.
  </div>
</div>
{:else}
<Spinner />
{/if}
