<script lang="ts">
  import {onMount} from "svelte"
  import {readable} from "svelte/store"
  import {displayRelayUrl, isShareableRelayUrl} from "@welshman/util"
  import type {SignedEvent} from "@welshman/util"
  import {subscribe, loadRelay, relaySearch} from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import {DEFAULT_RELAYS, INDEXER_RELAYS} from "@app/state"

  const relays = readable(DEFAULT_RELAYS)

  const removeRelay = (url: string) => null

  const addRelay = (url: string) => null

  let term = ""

  onMount(() => {
    const sub = subscribe({
      filters: [{kinds: [30166], "#N": ["29"]}],
      relays: [...INDEXER_RELAYS, ...DEFAULT_RELAYS],
    })

    sub.emitter.on("event", (url: string, event: SignedEvent) => {
      const d = event.tags.find(t => t[0] === "d")?.[1] || ""

      if (isShareableRelayUrl(d)) {
        loadRelay(d)
      }
    })

    return () => sub.close()
  })
</script>

<div class="content column gap-4">
  <h1 class="superheading mt-20">Relays</h1>
  <p class="text-center">Get connected with the nostr network</p>
  {#each $relays as url}
    <div class="card2 card2-sm flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Icon icon="remote-controller-minimalistic" />
        {displayRelayUrl(url)}
      </div>
      <Button class="flex items-center" on:click={() => removeRelay(url)}>
        <Icon icon="close-circle" />
      </Button>
    </div>
  {/each}
  <label class="input input-bordered flex w-full items-center gap-2">
    <Icon icon="magnifer" />
    <input bind:value={term} class="grow" type="text" placeholder="Search for relays..." />
  </label>
  {#each $relaySearch.searchValues(term).filter(url => !$relays.includes(url)) as url (url)}
    <div class="card2 card2-sm flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Icon icon="remote-controller-minimalistic" />
        {displayRelayUrl(url)}
      </div>
      <Button class="flex items-center" on:click={() => addRelay(url)}>
        <Icon icon="add-circle" />
      </Button>
    </div>
  {/each}
</div>
