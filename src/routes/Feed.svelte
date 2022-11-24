<script>
  import {onMount} from 'svelte'
  import {fly} from 'svelte/transition'
  import {navigate} from "svelte-routing"
  import {prop, last} from 'ramda'
  import Anchor from "src/partials/Anchor.svelte"
  import {nostr, relays} from "src/state/nostr"
  import {user} from "src/state/user"
  import {accounts} from "src/state/app"
  import {db} from "src/state/db"

  let notes = []
  let annotatedNotes = []

  $: {
    // Group notes so we're only showing the account once per chunk
    annotatedNotes = notes.reduce(
      (mx, m) => {
        const account = $accounts[m.pubkey]

        // If we don't have an account yet, don't show the message
        if (!account) {
          return mx
        }

        return mx.concat({
          ...m,
          account,
          showAccount: account !== prop('account', last(mx)),
        })
      },
      []
    )
  }

  const createNote = () => {
    navigate("/notes/new")
  }

  onMount(() => {
    const sub = nostr.sub({
      filter: {kinds: [1], since: new Date().valueOf() / 1000 - 7 * 24 * 60 * 60},
      cb: e => {
        notes = notes.concat(e)

        if (!$accounts[e.pubkey]) {
          const accountSub = nostr.sub({
            filter: {kinds: [0], authors: [e.pubkey]},
            cb: e => {
              $accounts[e.pubkey] = {
                ...$accounts[e.pubkey],
                ...JSON.parse(e.content),
              }

              accountSub.unsub()
            },
          })
        }
      },
    })

    return () => sub.unsub()
  })
</script>

<ul class="p-2">
  {#each annotatedNotes as n}
    <li in:fly={{y: 20}} class="py-1 chat-message">
      {#if n.showAccount}
      <div class="flex gap-2 items-center mt-2">
        <div
          class="overflow-hidden w-4 h-4 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
          style="background-image: url({n.account.picture})" />
        <span class="text-lg font-bold">{n.account.name}</span>
      </div>
      {/if}
      <div class="ml-6">{n.content}</div>
    </li>
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

