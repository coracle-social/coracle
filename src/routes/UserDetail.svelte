<script>
  import {onMount} from 'svelte'
  import {reverse} from 'ramda'
  import {fly} from 'svelte/transition'
  import {uniqBy, prop} from 'ramda'
  import {switcherFn} from 'hurdak/src/core'
  import {nostr} from 'src/state/nostr'
  import {user} from 'src/state/user'

  export let pubkey

  let userData
  let notes = []

  onMount(() => {
    const sub = nostr.sub({
      filter: {authors: [pubkey]},
      cb: e => {
        switcherFn(e.kind, {
          [0]: () => {
            userData = JSON.parse(e.content)
          },
          [1]: () => {
            notes = uniqBy(prop('id'), notes.concat(e))
          },
          default: () => null,
        })
      },
    })

    return () => sub.unsub()
  })

  const formatTimestamp = ts => {
    const formatter = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

    return formatter.format(new Date(ts * 1000))
  }
</script>

{#if userData}
<div class="max-w-2xl m-auto flex flex-col gap-4 py-4">
  <div class="flex flex-col gap-4" in:fly={{y: 20}}>
    <div class="flex gap-4">
      <div
        class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0"
        style="background-image: url({userData.picture})" />
      <div class="flex-grow">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl">{userData.name}</h1>
          {#if $user?.pubkey === pubkey}
            <a href="/settings/profile" class="cursor-pointer text-sm">
              <i class="fa-solid fa-edit" /> Edit
            </a>
          {/if}
        </div>
        <p>{userData.about}</p>
      </div>
    </div>
  </div>
  <div class="h-px bg-light" in:fly={{y: 20, delay: 200}} />
  <div class="flex flex-col gap-4" in:fly={{y: 20, delay: 400}}>
    {#each reverse(notes) as note}
    <div>
      <small class="text-light">{formatTimestamp(note.created_at)}</small>
      <p>{note.content}</p>
    </div>
    {/each}
  </div>
</div>
{/if}
