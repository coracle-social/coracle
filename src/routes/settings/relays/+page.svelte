<script lang="ts">
  import {onMount} from "svelte"
  import {derived} from "svelte/store"
  import {uniq} from "@welshman/lib"
  import {displayRelayUrl} from "@welshman/util"
  import {relaySearch, getRelayUrls, userRelaySelections, userInboxRelaySelections, getReadRelayUrls, getWriteRelayUrls} from "@welshman/app"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import {INDEXER_RELAYS, discoverRelays} from "@app/state"

  const readRelayUrls = derived(userRelaySelections, getReadRelayUrls)
  const writeRelayUrls = derived(userRelaySelections, getWriteRelayUrls)
  const inboxRelayUrls = derived(userInboxRelaySelections, getRelayUrls)

  const removeRelay = (url: string) => null

  const addRelay = (url: string) => null

  let term = ""
  let currentRelayUrls: string[] = []

  $: currentRelayUrls = uniq([
    ...currentRelayUrls,
    ...getRelayUrls($userRelaySelections),
    ...getRelayUrls($userInboxRelaySelections),
  ]).sort()

  onMount(() => {
    const sub = discoverRelays()

    return () => sub.close()
  })
</script>

<div class="content column gap-4">
  <h1 class="superheading mt-20">Relays</h1>
  <p class="text-center">Get connected with the nostr network</p>
  {#each currentRelayUrls as url}
    {@const read = $readRelayUrls.includes(url)}
    {@const write = $writeRelayUrls.includes(url)}
    {@const inbox = $inboxRelayUrls.includes(url)}
    <div class="card2 card2-sm flex flex-col gap-2 overflow-visible">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Icon icon="remote-controller-minimalistic" />
          {displayRelayUrl(url)}
        </div>
        <Button class="flex items-center" on:click={() => removeRelay(url)}>
          <Icon icon="close-circle" />
        </Button>
      </div>
      <div class="flex gap-3">
        <div
          class="tooltip tooltip-right"
          data-tip="Notes for you will {read ? '' : 'not'} be sent here.">
          <Button class="btn btn-sm btn-{read ? 'primary' : 'neutral'}">
            Read
          </Button>
        </div>
        <div
          class="tooltip tooltip-right"
          data-tip="Notes you publish will {write ? '' : 'not'} be sent here.">
          <Button class="btn btn-sm btn-{write ? 'primary' : 'neutral'}">
            Write
          </Button>
        </div>
        <div
          class="tooltip tooltip-right"
          data-tip="Direct messages will {inbox ? '' : 'not'} be sent here.">
          <Button class="btn btn-sm btn-{inbox ? 'primary' : 'neutral'}">
            Inbox
          </Button>
        </div>
      </div>
    </div>
  {/each}
  <label class="input input-bordered flex w-full items-center gap-2">
    <Icon icon="magnifer" />
    <input bind:value={term} class="grow" type="text" placeholder="Search for relays..." />
  </label>
  {#each $relaySearch.searchValues(term).filter(url => !currentRelayUrls.includes(url)) as url (url)}
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
