<script>
  import {fly} from 'svelte/transition'
  import {fuzzy} from "src/util/misc"
  import Input from "src/partials/Input.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {dispatch} from "src/state/dispatch"
  import {modal} from "src/state/app"
  import {relays, knownRelays} from "src/state/nostr"

  let q = ""
  let search

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
      {#each search(q).slice(0, 10) as relay}
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
      <a
        class="underline cursor-pointer"
        on:click={() => modal.set({form: 'relay'})}>
        <i class="fa-solid fa-plus" /> Add Relay
      </a>
    </div>
  </div>
</div>
