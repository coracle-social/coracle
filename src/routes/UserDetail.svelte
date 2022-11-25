<script>
  import {onMount} from 'svelte'
  import {reverse} from 'ramda'
  import {fly} from 'svelte/transition'
  import {uniqBy, prop} from 'ramda'
  import {ellipsize} from 'hurdak/src/core'
  import {formatTimestamp} from 'src/util/misc'
  import Note from "src/partials/Note.svelte"
  import {nostr} from 'src/state/nostr'
  import {user as currentUser} from 'src/state/user'
  import {accounts, ensureAccount} from "src/state/app"

  export let pubkey

  let user
  let notes = []

  $: user = $accounts[pubkey]

  onMount(async () => {
    await ensureAccount(pubkey)

    const sub = nostr.sub({
      filter: {authors: [pubkey], kinds: [1]},
      cb: e => {
        notes = uniqBy(prop('id'), notes.concat(e))
      },
    })

    return () => sub.unsub()
  })
</script>

{#if user}
<div class="max-w-2xl m-auto flex flex-col gap-4 py-8 px-4">
  <div class="flex flex-col gap-4" in:fly={{y: 20}}>
    <div class="flex gap-4">
      <div
        class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
        style="background-image: url({user.picture})" />
      <div class="flex-grow">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl">{user.name}</h1>
          {#if $currentUser?.pubkey === pubkey}
            <a href="/settings/profile" class="cursor-pointer text-sm">
              <i class="fa-solid fa-edit" /> Edit
            </a>
          {/if}
        </div>
        <p>{user.about || ''}</p>
      </div>
    </div>
  </div>
  <div class="h-px bg-medium" in:fly={{y: 20, delay: 200}} />
  <div class="flex flex-col gap-4" in:fly={{y: 20, delay: 400}}>
    {#each reverse(notes) as note}
    <Note note={note} />
    {/each}
  </div>
</div>
{/if}
