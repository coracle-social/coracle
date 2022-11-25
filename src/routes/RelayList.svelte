<script>
  import {liveQuery} from "dexie"
  import {propEq} from "ramda"
  import {fly} from 'svelte/transition'
  import {fuzzy, hash} from "src/util/misc"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {db} from "src/state/db"
  import {dispatch} from "src/state/dispatch"
  import {nostr, relays} from "src/state/nostr"

  let q = ""
  let search

  const knownRelays = liveQuery(() => db.relays.toArray())

  $: search = fuzzy($knownRelays || [], {keys: ["name", "description", "url"]})

  const toggle = (url, value) => {
    dispatch(value ? "relay/join" : "relay/leave", url)
  }
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
    <div class="flex gap-4">
      <Input bind:value={q} type="text" wrapperClass="flex-grow" placeholder="Type to search">
        <i slot="before" class="fa-solid fa-search" />
      </Input>
      <Anchor type="button" href="/notes">Done</Anchor>
    </div>
    <div class="flex flex-col gap-6 overflow-auto flex-grow -mx-6 px-6">
      {#each search(q) as relay}
        <div class="flex gap-2 justify-between">
          <div>
            <strong>{relay.name || relay.url}</strong>
            <p class="text-light">{relay.description || ''}</p>
          </div>
          <a
            class="underline cursor-pointer"
            on:click={() => toggle(relay.url, !$relays.includes(relay.url))}>
            {$relays.includes(relay.url) ? "Leave" : "Join"}
          </a>
        </div>
      {/each}
    </div>
  </div>
</div>
