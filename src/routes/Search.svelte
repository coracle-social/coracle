<script>
  import {onMount, onDestroy} from 'svelte'
  import {writable} from 'svelte/store'
  import {fly} from 'svelte/transition'
  import {uniqBy, pluck, prop} from 'ramda'
  import {fuzzy} from "src/util/misc"
  import Anchor from "src/partials/Anchor.svelte"
  import Input from "src/partials/Input.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/partials/Note.svelte"
  import {relays, Cursor} from "src/state/nostr"
  import {user} from "src/state/user"
  import {createScroller, ensureAccounts, accounts, annotateNotes, modal} from "src/state/app"

  export let type

  const data = writable([])
  let q = ''
  let search
  let results
  let cursor
  let scroller
  let modalUnsub

  $: search = fuzzy($data, {keys: type === 'people' ? ["name", "about", "pubkey"] : ["content"]})

  $: {
    scroller?.start()
    results = search(q)
  }

  onMount(async () => {
    cursor = new Cursor({kinds: type === 'people' ? [0] : [1]})
    scroller = createScroller(cursor, async chunk => {
      if (type === 'people') {
        await ensureAccounts(pluck('pubkey', chunk))

        data.set(Object.values($accounts))
      } else {
        const annotated = await annotateNotes(chunk)

        data.update($data => uniqBy(prop('id'), $data.concat(annotated)))
      }
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
    class="cursor-pointer hover:border-b border-solid border-medium"
    class:border-b={type === 'people'}>
    <a class="block px-8 py-4 " href="/search/people">People</a>
  </li>
  <li
    class="cursor-pointer hover:border-b border-solid border-medium"
    class:border-b={type === 'notes'}>
    <a class="block px-8 py-4 " href="/search/notes">Notes</a>
  </li>
</ul>

<div class="max-w-xl m-auto mt-4" in:fly={{y: 20}}>
  <Input bind:value={q} placeholder="Search for {type}">
    <i slot="before" class="fa-solid fa-search" />
  </Input>
</div>

{#if type === 'people'}
<ul class="py-8 flex flex-col gap-2 max-w-xl m-auto">
  {#each (results || []) as e (e.pubkey)}
    {#if e.pubkey !== $user.pubkey}
    <li in:fly={{y: 20}}>
      <a href="/users/{e.pubkey}" class="flex gap-4 my-4">
        <div
          class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
          style="background-image: url({e.picture})" />
        <div class="flex-grow">
          <h1 class="text-2xl">{e.name || e.pubkey.slice(0, 8)}</h1>
          <p>{e.about || ''}</p>
        </div>
      </a>
    <li>
    {/if}
  {/each}
</ul>
{/if}

{#if type === 'notes'}
<ul class="py-8 flex flex-col gap-2 max-w-xl m-auto">
  {#each (results || []) as e (e.id)}
    <li in:fly={{y: 20}}>
      <Note interactive note={e} />
      {#each e.replies as r (r.id)}
      <div class="ml-6 border-l border-solid border-medium">
        <Note interactive isReply note={r} />
      </div>
      {/each}
    </li>
  {/each}
</ul>
{/if}

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

