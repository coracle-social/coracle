<script>
  import {onMount, onDestroy} from 'svelte'
  import {writable} from 'svelte/store'
  import {uniqBy, prop} from 'ramda'
  import {fly} from 'svelte/transition'
  import Note from "src/partials/Note.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Button from "src/partials/Button.svelte"
  import {Cursor, epoch} from 'src/state/nostr'
  import {user as currentUser} from 'src/state/user'
  import {t, dispatch} from 'src/state/dispatch'
  import {accounts, getFollow, createScroller, notesListener, modal, annotateNotes} from "src/state/app"

  export let pubkey

  const notes = writable([])
  let user
  let cursor
  let listener
  let scroller
  let interval
  let loading = true
  let modalUnsub
  let following = getFollow(pubkey)

  $: user = $accounts[pubkey]

  onMount(async () => {
    cursor = new Cursor({kinds: [1], authors: [pubkey]})
    listener = await notesListener(notes, [{kinds: [1], authors: [pubkey]}, {kinds: [5, 7]}])
    scroller = createScroller(cursor, async chunk => {
      const annotated = await annotateNotes(chunk, {showParents: true})

      notes.update($notes => uniqBy(prop('id'), $notes.concat(annotated)))
    })

    // Populate our initial empty space
    scroller.start()

    // Track loading based on cursor cutoff date
    interval = setInterval(() => {
      loading = cursor.since > epoch
    }, 1000)

    // When a modal opens, suspend our subscriptions
    modalUnsub = modal.subscribe(async $modal => {
      if ($modal) {
        cursor.stop()
        listener.stop()
      } else {
        cursor.start()
        listener.start()
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

  const follow = () => {
    const petnames = $currentUser.petnames
      .concat([t("p", user.pubkey, user.name)])

    console.log(petnames)

    dispatch('account/petnames', petnames)

    following = true
  }

  const unfollow = () => {
    const petnames = $currentUser.petnames
      .filter(([_, pubkey]) => pubkey !== user.pubkey)

    dispatch('account/petnames', petnames)

    following = false
  }

  const openAdvanced = () => {
    modal.set({form: 'user/advanced', user})
  }
</script>

<svelte:window on:scroll={scroller?.start} />

{#if user}
<div class="max-w-2xl m-auto flex flex-col gap-4 py-8 px-4">
  <div class="flex flex-col gap-4" in:fly={{y: 20}}>
    <div class="flex gap-4">
      <div
        class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
        style="background-image: url({user.picture})" />
      <div class="flex-grow">
        <div class="flex items-center gap-2">
          <h1 class="text-2xl">{user.name}</h1>
          {#if $currentUser && $currentUser.pubkey !== pubkey}
            <i class="fa-solid fa-sliders cursor-pointer" on:click={openAdvanced} />
          {/if}
        </div>
        <p>{user.about || ''}</p>
      </div>
      <div class="whitespace-nowrap">
        {#if $currentUser?.pubkey === pubkey}
        <a href="/settings/profile" class="cursor-pointer text-sm">
          <i class="fa-solid fa-edit" /> Edit
        </a>
        {:else}
        <div class="flex flex-col items-end gap-2">
          {#if following}
          <Button on:click={unfollow}>Unfollow</Button>
          {:else}
          <Button on:click={follow}>Follow</Button>
          {/if}
        </div>
        {/if}
      </div>
    </div>
  </div>
  <div class="h-px bg-medium" in:fly={{y: 20, delay: 200}} />
  <ul class="flex flex-col" in:fly={{y: 20, delay: 400}}>
    {#each (notes ? $notes : []) as n (n.id)}
    <li>
      <Note interactive note={n} />
      {#each n.replies as r (r.id)}
        <div class="ml-6 border-l border-solid border-medium">
          <Note interactive isReply note={r} />
        </div>
      {/each}
    </li>
    {:else}
    {#if loading}
    <li><Spinner /></li>
    {:else}
    <li class="p-20 text-center" in:fly={{y: 20}}>No notes found.</li>
    {/if}
    {/each}
  </ul>
</div>
{/if}
