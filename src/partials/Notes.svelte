<script>
  import {onMount, onDestroy} from 'svelte'
  import {fly} from 'svelte/transition'
  import {uniqBy, sortBy, reject, prop} from 'ramda'
  import {pluralize} from 'hurdak/lib/hurdak'
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/partials/Note.svelte"
  import {Cursor, epoch, filterTags} from 'src/state/nostr'
  import {createScroller, getMuffleValue, threadify, combineThreads, notesListener, modal} from "src/state/app"

  export let filter
  export let notes
  export let shouldMuffle = false

  let cursor
  let listener
  let scroller
  let modalUnsub
  let interval
  let loading = true

  const getRoot = n => {
    if (!n.parent) {
      return null
    }

    while (n.parent) {
      n = n.parent
    }

    return n
  }

  onMount(async () => {
    cursor = new Cursor(filter)
    listener = await notesListener(notes, [filter, {kinds: [5, 7]}], {shouldMuffle})
    scroller = createScroller(cursor, async chunk => {
      // Remove a sampling of content if desired
      if (shouldMuffle) {
        chunk = reject(n => Math.random() > getMuffleValue(n.pubkey), chunk)
      }

      // Remove anything that's an ancestor of something we've already seen
      const seen = $notes.flatMap(n => filterTags({tag: "e"}, n))

      // Add chunk context and combine threads
      chunk = combineThreads(await threadify(reject(n => seen.includes(n.id), chunk)))

      // Sort and deduplicate
      notes.set(sortBy(n => -n.created_at, uniqBy(prop('id'), $notes.concat(chunk))))
    })

    // Track loading based on cursor cutoff date
    interval = setInterval(() => {
      loading = cursor.since > epoch
    }, 1000)

    // When a modal opens, suspend our subscriptions
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
  {#each $notes as n (n.id)}
    {@const root = getRoot(n)}
    <li>
      <div class="relative">
        {#if n.parent}
          <div class="w-px bg-medium absolute h-full ml-5 -mr-5 mt-5" />
        {/if}
        {#if root && root.id !== n.parent?.id}
        <Note interactive note={root} />
        {/if}
        {#if n.numberOfAncestors > 2}
        <div class="z-10 text-medium bg-black relative py-1 px-2" style="left: 10px" in:fly={{y: 20}}>
          <i class="fa-solid fa-ellipsis-v" />
          <span class="pl-2 text-light opacity-75">
            {n.numberOfAncestors - 2} other {pluralize(n.numberOfAncestors - 2, 'note')}
            in this conversation
          </span>
        </div>
        {/if}
        {#if n.parent}
        <Note interactive depth={0} note={n.parent} />
        {/if}
      </div>
      <Note interactive depth={1} note={n} />
    </li>
  {:else}
  {#if loading}
  <li><Spinner /></li>
  {:else}
  <li class="p-20 text-center" in:fly={{y: 20}}>No notes found.</li>
  {/if}
  {/each}
</ul>
