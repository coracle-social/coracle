<script lang="ts">
  import {onMount} from "svelte"
  import {derived} from "svelte/store"
  import {
    getRelayUrls,
    userRelaySelections,
    userInboxRelaySelections,
    getReadRelayUrls,
    getWriteRelayUrls,
    relaySelections,
    inboxRelaySelections,
  } from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Collapse from "@lib/components/Collapse.svelte"
  import RelayItem from "@app/components/RelayItem.svelte"
  import RelayAdd from "@app/components/RelayAdd.svelte"
  import {pushModal} from "@app/modal"
  import {discoverRelays} from "@app/requests"
  import {setRelayPolicy, setInboxRelayPolicy} from "@app/commands"

  const readRelayUrls = derived(userRelaySelections, getReadRelayUrls)
  const writeRelayUrls = derived(userRelaySelections, getWriteRelayUrls)
  const inboxRelayUrls = derived(userInboxRelaySelections, getRelayUrls)

  const addReadRelay = () =>
    pushModal(RelayAdd, {
      relays: readRelayUrls,
      addRelay: (url: string) => setRelayPolicy(url, true, $writeRelayUrls.includes(url)),
    })

  const addWriteRelay = () =>
    pushModal(RelayAdd, {
      relays: writeRelayUrls,
      addRelay: (url: string) => setRelayPolicy(url, $readRelayUrls.includes(url), true),
    })

  const addInboxRelay = () =>
    pushModal(RelayAdd, {
      relays: inboxRelayUrls,
      addRelay: (url: string) => setInboxRelayPolicy(url, true),
    })

  const removeReadRelay = (url: string) => setRelayPolicy(url, false, $writeRelayUrls.includes(url))

  const removeWriteRelay = (url: string) => setRelayPolicy(url, $readRelayUrls.includes(url), false)

  const removeInboxRelay = (url: string) => setInboxRelayPolicy(url, false)

  onMount(() => {
    discoverRelays([...$relaySelections, ...$inboxRelaySelections])
  })
</script>

<div class="content column gap-4">
  <Collapse class="card2 bg-alt column gap-4">
    {#snippet title()}
      <h2 class="flex items-center gap-3 text-xl">
        <Icon icon="earth" />
        Outbox Relays
      </h2>
    {/snippet}
    {#snippet description()}
      <p class="text-sm">
        These relays will be advertised on your profile as places where you send your public notes.
        Be sure to select relays that will accept your notes, and which will let people who follow
        you read them.
      </p>
    {/snippet}
    <div class="column gap-2">
      {#each $writeRelayUrls.sort() as url (url)}
        <RelayItem {url}>
          <Button
            class="tooltip flex items-center"
            data-tip="Stop using this relay"
            onclick={() => removeWriteRelay(url)}>
            <Icon icon="close-circle" />
          </Button>
        </RelayItem>
      {:else}
        <p class="text-center text-sm">No relays found</p>
      {/each}
      <Button class="btn btn-primary mt-2" onclick={addWriteRelay}>
        <Icon icon="add-circle" />
        Add Relay
      </Button>
    </div>
  </Collapse>
  <Collapse class="card2 bg-alt column gap-4">
    {#snippet title()}
      <h2 class="flex items-center gap-3 text-xl">
        <Icon icon="inbox" />
        Inbox Relays
      </h2>
    {/snippet}
    {#snippet description()}
      <p class="text-sm">
        These relays will be advertised on your profile as places where other people should send
        notes intended for you. Be sure to select relays that will accept notes that tag you.
      </p>
    {/snippet}
    <div class="column gap-2">
      {#each $readRelayUrls.sort() as url (url)}
        <RelayItem {url}>
          <Button
            class="tooltip flex items-center"
            data-tip="Stop using this relay"
            onclick={() => removeReadRelay(url)}>
            <Icon icon="close-circle" />
          </Button>
        </RelayItem>
      {:else}
        <p class="text-center text-sm">No relays found</p>
      {/each}
      <Button class="btn btn-primary mt-2" onclick={addReadRelay}>
        <Icon icon="add-circle" />
        Add Relay
      </Button>
    </div>
  </Collapse>
  <Collapse class="card2 bg-alt column gap-4">
    {#snippet title()}
      <h2 class="flex items-center gap-3 text-xl">
        <Icon icon="mailbox" />
        Messaging Relays
      </h2>
    {/snippet}
    {#snippet description()}
      <p class="text-sm">
        These relays will be advertised on your profile as places you use to send and receive direct
        messages. Be sure to select relays that will accept your messages and messages from people
        you'd like to be in contact with.
      </p>
    {/snippet}
    <div class="column gap-2">
      {#each $inboxRelayUrls.sort() as url (url)}
        <RelayItem {url}>
          <Button
            class="tooltip flex items-center"
            data-tip="Stop using this relay"
            onclick={() => removeInboxRelay(url)}>
            <Icon icon="close-circle" />
          </Button>
        </RelayItem>
      {:else}
        <p class="text-center text-sm">No relays found</p>
      {/each}
      <Button class="btn btn-primary mt-2" onclick={addInboxRelay}>
        <Icon icon="add-circle" />
        Add Relay
      </Button>
    </div>
  </Collapse>
</div>
