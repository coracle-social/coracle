<script>
  import {fly} from 'svelte/transition'
  import {find, identity, whereEq, reject} from 'ramda'
  import {fuzzy} from "src/util/misc"
  import Input from "src/partials/Input.svelte"
  import {dispatch} from "src/state/dispatch"
  import {relays, knownRelays} from "src/state/nostr"
  import {modal} from "src/state/app"

  let q = ""
  let search
  let data

  $: data = reject(r => $relays.includes(r.url), $knownRelays || [])
  $: search = fuzzy(data, {keys: ["name", "description", "url"]})

  const join = url => dispatch("relay/join", url)

  const leave = url => dispatch("relay/leave", url)
</script>

<div class="flex justify-center py-8 px-4" in:fly={{y: 20}}>
  <div class="flex flex-col gap-8 max-w-2xl w-full">
    <div class="flex justify-center items-center flex-col mb-4">
      <h1 class="staatliches text-6xl">Get Connected</h1>
      <p>
        Relays are hubs for your content and connections. At least one is required to
        interact with the network, but you can join as many as you like.
      </p>
    </div>
    <Input bind:value={q} type="text" wrapperClass="flex-grow" placeholder="Type to search">
      <i slot="before" class="fa-solid fa-search" />
    </Input>
    <div class="flex flex-col gap-6 overflow-auto flex-grow -mx-6 px-6">
      {#each $relays.map(url => find(whereEq({url}), $knownRelays)).filter(identity) as relay}
        <div class="flex gap-2 justify-between">
          <div>
            <strong>{relay.name || relay.url}</strong>
            <p class="text-light">{relay.description || ''}</p>
          </div>
          <a class="underline cursor-pointer" on:click={() => leave(relay.url)}>
            Leave
          </a>
        </div>
      {/each}
      {#if $relays.length > 0}
      <div class="pt-2 mb-2 border-b border-solid border-medium" />
      {/if}
      {#each search(q).slice(0, 10) as relay}
        <div class="flex gap-2 justify-between">
          <div>
            <strong>{relay.name || relay.url}</strong>
            <p class="text-light">{relay.description || ''}</p>
          </div>
          <a class="underline cursor-pointer" on:click={() => join(relay.url)}>
            Join
          </a>
        </div>
      {/each}
      <a
        class="underline cursor-pointer"
        on:click={() => modal.set({form: 'relay'})}>
        <i class="fa-solid fa-plus" /> Add Relay
      </a>
    </div>
  </div>
</div>
