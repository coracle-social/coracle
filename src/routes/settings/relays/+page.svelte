<script lang="ts">
  import {derived} from "svelte/store"
  import type {Readable} from 'svelte/store'
  import {relaySearch, getRelayUrls, userRelaySelections, userInboxRelaySelections, getReadRelayUrls, getWriteRelayUrls} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Collapse from "@lib/components/Collapse.svelte"
  import RelayItem from "@app/components/RelayItem.svelte"
  import RelayAdd from "@app/components/RelayAdd.svelte"
  import {pushModal} from '@app/modal'

  const readRelayUrls = derived(userRelaySelections, getReadRelayUrls)
  const writeRelayUrls = derived(userRelaySelections, getWriteRelayUrls)
  const inboxRelayUrls = derived(userInboxRelaySelections, getRelayUrls)

  const addRelay = (mode: string, relays: Readable<string[]>) =>
    pushModal(RelayAdd, {mode, relays})

  const removeReadRelay = (url: string) => null

  const removeWriteRelay = (url: string) => null

  const removeInboxRelay = (url: string) => null
</script>

<div class="content column gap-4">
  <Collapse class="card2 bg-alt column gap-4">
    <h2 slot="title" class="text-xl flex items-center gap-3">
      <Icon icon="earth" />
      Broadcast Relays
    </h2>
    <p slot="description" class="text-sm">
      These relays will be advertised on your profile as places where you send your public
      notes. Be sure to select relays that will accept your notes, and which will let people
      who follow you read them.
    </p>
    <div class="column gap-2">
      {#each $writeRelayUrls.sort() as url (url)}
        <RelayItem {url}>
          <Button
            class="flex items-center tooltip"
            data-tip="Stop using this relay"
            on:click={() => removeWriteRelay(url)}>
            <Icon icon="close-circle" />
          </Button>
        </RelayItem>
      {:else}
        <p class="text-center text-sm">No relays found</p>
      {/each}
      <Button class="btn btn-primary mt-2" on:click={() => addRelay('write', writeRelayUrls)}>
        <Icon icon="add-circle" />
        Add Relay
      </Button>
    </div>
  </Collapse>
  <Collapse class="card2 bg-alt column gap-4">
    <h2 slot="title" class="text-xl flex items-center gap-3">
      <Icon icon="inbox" />
      Inbox Relays
    </h2>
    <p slot="description" class="text-sm">
      These relays will be advertised on your profile as places where other people should
      send notes intended for you. Be sure to select relays that will accept notes that
      tag you.
    </p>
    <div class="column gap-2">
      {#each $readRelayUrls.sort() as url (url)}
        <RelayItem {url}>
          <Button
            class="flex items-center tooltip"
            data-tip="Stop using this relay"
            on:click={() => removeReadRelay(url)}>
            <Icon icon="close-circle" />
          </Button>
        </RelayItem>
      {:else}
        <p class="text-center text-sm">No relays found</p>
      {/each}
      <Button class="btn btn-primary mt-2" on:click={() => addRelay('read', readRelayUrls)}>
        <Icon icon="add-circle" />
        Add Relay
      </Button>
    </div>
  </Collapse>
  <Collapse class="card2 bg-alt column gap-4">
    <h2 slot="title" class="text-xl flex items-center gap-3">
      <Icon icon="mailbox" />
      Messaging Relays
    </h2>
    <p slot="description" class="text-sm">
      These relays will be advertised on your profile as places you use to send and
      receive direct messages. Be sure to select relays that will accept your messages
      and messages from people you'd like to be in contact with.
    </p>
    <div class="column gap-2">
      {#each $inboxRelayUrls.sort() as url (url)}
        <RelayItem {url}>
          <Button
            class="flex items-center tooltip"
            data-tip="Stop using this relay"
            on:click={() => removeInboxRelay(url)}>
            <Icon icon="close-circle" />
          </Button>
        </RelayItem>
      {:else}
        <p class="text-center text-sm">No relays found</p>
      {/each}
      <Button class="btn btn-primary mt-2" on:click={() => addRelay('inbox', inboxRelayUrls)}>
        <Icon icon="add-circle" />
        Add Relay
      </Button>
    </div>
  </Collapse>
</div>
