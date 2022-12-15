<script>
  import {onMount, onDestroy} from 'svelte'
  import {fly} from 'svelte/transition'
  import {writable} from 'svelte/store'
  import {sortBy, uniqBy, prop} from 'ramda'
  import {now} from 'src/util/misc'
  import {annotateAlerts, notesListener, createScroller} from 'src/util/notes'
  import {ellipsize} from 'hurdak/src/core'
  import {user} from 'src/state/user'
  import {Cursor, epoch} from 'src/state/nostr'
  import {alerts, modal} from 'src/state/app'
  import Spinner from "src/partials/Spinner.svelte"
  import UserBadge from "src/partials/UserBadge.svelte"
  import Note from 'src/partials/Note.svelte'

  let cursor
  let listener
  let scroller
  let interval
  let modalUnsub
  let loading = true
  let events = writable([])

  onMount(async () => {
    // Clear notification badge
    alerts.set({...$alerts, since: now()})

    cursor = new Cursor({kinds: [1, 7], '#p': [$user.pubkey]})
    listener = await notesListener(events, [{kinds: [1, 5, 7]}], {repliesOnly: true})
    scroller = createScroller(cursor, async chunk => {
      // Add chunk context
      chunk = await annotateAlerts(chunk)

      // Sort and deduplicate
      events.set(sortBy(n => -n.created_at, uniqBy(prop('id'), $events.concat(chunk))))
    })

    // Track loading based on cursor cutoff date
    interval = setInterval(() => {
      loading = cursor.since > epoch
    }, 1000)

    modalUnsub = modal.subscribe(async $modal => {
      if ($modal) {
        cursor.stop()
        listener.stop()
        scroller.stop()
      } else {
        cursor.start()
        listener.start()
        scroller.start()
      }
    })
  })

  onDestroy(() => {
    cursor?.stop()
    listener?.stop()
    scroller?.stop()
    modalUnsub?.()
    clearInterval(interval)
  })
</script>

<svelte:window on:scroll={scroller?.start} />

<ul class="py-4 flex flex-col gap-2 max-w-xl m-auto">
  {#each $events as e (e.id)}
  {#if e.kind === 7}
  <!-- don't show alerts for likes of replies to this user's notes -->
  {#if e.parent?.pubkey === $user.pubkey}
  <li
    in:fly={{y: 20}}
    class="py-2 px-3 flex flex-col gap-2 text-white cursor-pointer transition-all
           border border-solid border-black hover:border-medium hover:bg-dark"
    on:click={() => modal.set({note: e.parent})}>
    <div class="flex gap-2 items-center">
      <UserBadge user={e.user} />
      <span>liked your note.</span>
    </div>
    <div class="ml-6 text-light">
      {ellipsize(e.parent.content, 240)}
    </div>
  </li>
  {/if}
  {:else}
  <li in:fly={{y: 20}}><Note showParent note={e} /></li>
  {/if}
  {/each}
</ul>

{#if loading}
<div in:fly={{y: 20}}><Spinner /></div>
{:else if $events.length === 0}
<div in:fly={{y: 20}} class="flex w-full justify-center items-center py-16">
  <div class="text-center max-w-md">
    No recent activity found.
  </div>
</div>
{/if}
