<script>
  import {onMount, onDestroy} from 'svelte'
  import {writable} from 'svelte/store'
  import {fly} from 'svelte/transition'
  import {uniqBy, identity, uniq, pluck, prop} from 'ramda'
  import {fuzzy} from "src/util/misc"
  import Anchor from "src/partials/Anchor.svelte"
  import Input from "src/partials/Input.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/partials/Note.svelte"
  import {relays, Cursor} from "src/state/nostr"
  import {createScroller, accounts, annotateNotes, modal} from "src/state/app"

  const notes = writable([])
  const people = writable([])
  let type = writable('people')
  let q = ''
  let search
  let results
  let cursor
  let scroller
  let modalUnsub

  $: search = (
    $type === 'people'
      ? fuzzy($people, {keys: ["name", "about"]})
      : fuzzy($notes, {keys: ["content"]})
  )

  $: {
    scroller?.start()
    results = search(q)
  }

  onMount(async () => {
    cursor = new Cursor({kinds: [1]})
    scroller = createScroller(cursor, async chunk => {
      const annotated = await annotateNotes(chunk)
      const keys = uniq(pluck('pubkey', chunk))

      notes.update($notes => uniqBy(prop('id'), $notes.concat(annotated)))
      people.update($people => {
        $people = $people.concat(keys.map(k => $accounts[k]).filter(identity))

        return uniqBy(prop('pubkey'), $people)
      })
    })

    // When a modal opens, suspend our subscriptions
    modalUnsub = modal.subscribe(async $modal => {
      if ($modal) {
        cursor.stop()
        scroller.stop()
      } else {
        cursor.start()
        scroller.start()
      }
    })
  })

  onDestroy(() => {
    cursor?.stop()
    scroller?.stop()
    modalUnsub?.()
  })
</script>

<svelte:window on:scroll={scroller?.start} />

<ul class="border-b border-solid border-dark flex max-w-xl m-auto pt-2" in:fly={{y: 20}}>
  <li
    class="px-8 py-4 cursor-pointer hover:border-b border-solid border-medium"
    class:border-b={$type === 'people'}
    on:click={() => type.set('people')}>
    People
  </li>
  <li
    class="px-8 py-4 cursor-pointer hover:border-b border-solid border-medium"
    class:border-b={$type === 'notes'}
    on:click={() => type.set('notes')}>
    Notes
  </li>
</ul>

<div class="max-w-xl m-auto mt-4" in:fly={{y: 20}}>
  <Input bind:value={q} placeholder="Search for {$type}">
    <i slot="before" class="fa-solid fa-search" />
  </Input>
</div>

<ul class="py-8 flex flex-col gap-2 max-w-xl m-auto">
  {#each (results || []) as e (e.id || e.pubkey)}
    <li in:fly={{y: 20}}>
      {#if e.isAccount}
      <a href="/users/{e.pubkey}" class="flex gap-4 my-4">
        <div
          class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
          style="background-image: url({e.picture})" />
        <div class="flex-grow">
          <h1 class="text-2xl">{e.name}</h1>
          <p>{e.about || ''}</p>
        </div>
      </a>
      {:else}
      <Note interactive note={e} />
      {#each e.replies as r (r.id)}
      <div class="ml-6 border-l border-solid border-medium">
        <Note interactive isReply note={r} />
      </div>
      {/each}
      {/if}
    </li>
  {/each}
</ul>

<!-- This will always be sitting at the bottom in case infinite scrolling can't keep up -->
<Spinner />

{#if $relays.length === 0}
<div class="flex w-full justify-center items-center py-16">
  <div class="text-center max-w-md">
    You aren't yet connected to any relays. Please click <Anchor href="/settings/relays"
      >here</Anchor
    > to get started.
  </div>
</div>
{/if}

