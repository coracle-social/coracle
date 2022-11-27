<script>
  import {onMount} from 'svelte'
  import {reverse} from 'ramda'
  import {fly} from 'svelte/transition'
  import {now, timedelta} from 'src/util/misc'
  import Note from "src/partials/Note.svelte"
  import {channels} from 'src/state/nostr'
  import {user as currentUser} from 'src/state/user'
  import {accounts, findNotesAndWatchModal, modal} from "src/state/app"

  export let pubkey

  let user
  let notes

  $: user = $accounts[pubkey]

  onMount(() => {
    return findNotesAndWatchModal({
      authors: [pubkey],
      limit: 100,
    }, $notes => {
      if ($notes.length) {
        notes = $notes
      }
    })
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
  <ul class="flex flex-col -mt-4" in:fly={{y: 20, delay: 400}}>
    {#each reverse(notes || []) as n (n.id)}
    <li class="border-l border-solid border-medium pb-2">
      <Note interactive note={n} />
      {#each n.replies as r (r.id)}
        <div class="ml-6 border-l border-solid border-medium">
          <Note interactive isReply note={r} />
        </div>
      {/each}
    </li>
    {:else}
    <li class="py-4">This user hasn't posted any notes.</li>
    {/each}
  </ul>
</div>
{/if}
