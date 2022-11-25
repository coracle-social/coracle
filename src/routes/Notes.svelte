<script>
  import {onMount} from 'svelte'
  import {get} from 'svelte/store'
  import {fly} from 'svelte/transition'
  import {navigate} from "svelte-routing"
  import {prop, reverse, last} from 'ramda'
  import {timedelta, now, formatTimestamp} from 'src/util/misc'
  import Anchor from "src/partials/Anchor.svelte"
  import Note from "src/partials/Note.svelte"
  import {nostr, relays} from "src/state/nostr"
  import {user} from "src/state/user"
  import {accounts, ensureAccount} from "src/state/app"
  import {db} from "src/state/db"

  let notes = []

  const createNote = () => {
    navigate("/notes/new")
  }

  onMount(() => {
    const sub = nostr.sub({
      filter: {kinds: [1], since: new Date().valueOf() / 1000 - 7 * 24 * 60 * 60},
      cb: e => {
        notes = notes.concat(e)

        ensureAccount(e.pubkey)
      },
    })

    return () => sub.unsub()
  })
</script>

<ul class="py-8 flex flex-col gap-4 max-w-xl m-auto">
  {#each reverse(notes) as n}
    <Note note={n} />
  {/each}
</ul>

{#if $relays.length > 0}
<div class="fixed bottom-0 right-0 p-8">
  <div
    class="rounded-full bg-accent color-white w-16 h-16 flex justify-center
            items-center border border-dark shadow-2xl cursor-pointer"
    on:click={createNote}
  >
    <span class="fa-sold fa-plus fa-2xl" />
  </div>
</div>
{:else}
<div class="flex w-full justify-center items-center py-16">
  <div class="text-center max-w-md">
    You aren't yet connected to any relays. Please click <Anchor href="/settings/relays"
      >here</Anchor
    > to get started.
  </div>
</div>
{/if}

