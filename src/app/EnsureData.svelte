<script>
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Modal from "src/partials/Modal.svelte"
  import PersonInfo from "src/app/shared/PersonInfo.svelte"
  import RelaySearch from "src/app/shared/RelaySearch.svelte"
  import RelayCard from "src/app/shared/RelayCard.svelte"
  import PersonSearch from "src/app/shared/PersonSearch.svelte"
  import {getPersonWithFallback} from "src/agent/db"
  import user from "src/agent/user"
  import pool from "src/agent/pool"

  export let enforceRelays = pool.forceUrls.length === 0
  export let enforcePeople = true

  const {petnamePubkeys, relays} = user
  const needsRelays = () => $relays.length === 0 && enforceRelays
  const needsPeople = () => $petnamePubkeys.length === 0 && enforcePeople

  let modal = needsRelays() ? "relays" : needsPeople() ? "people" : null

  const closeModal = () => {
    modal = null
  }
</script>

{#if modal === "relays"}
  <Modal onEscape={closeModal}>
    <Content>
      {#if $relays.length > 0}
        <h1 class="text-2xl">Your Relays</h1>
      {/if}
      <div class="flex flex-col gap-2">
        {#each $relays as relay (relay.url)}
          <RelayCard showActions {relay} />
        {:else}
          <div class="flex flex-col items-center gap-4 my-8">
            <div class="text-xl flex gap-2 items-center">
              <i class="fa fa-triangle-exclamation fa-light" />
              You aren't yet connected to any relays.
            </div>
            <div>Search below to find one to join.</div>
          </div>
        {/each}
      </div>
      <RelaySearch>
        <div slot="item" let:relay>
          <RelayCard showActions {relay} />
        </div>
      </RelaySearch>
    </Content>
  </Modal>
{:else if needsRelays()}
  <Content size="lg">
    <div class="mt-12 flex flex-col items-center gap-4">
      <div class="flex items-center gap-2 text-xl">
        <i class="fa fa-triangle-exclamation fa-light" />
        You aren't yet connected to any relays.
      </div>
      <div>
        Click <Anchor href="/relays">here</Anchor> to find one to join.
      </div>
    </div>
  </Content>
{:else if modal === "people"}
  <Modal onEscape={closeModal}>
    <Content>
      {#if $petnamePubkeys.length > 0}
        <h1 class="text-2xl">Your Follows</h1>
      {/if}
      {#each $petnamePubkeys as pubkey (pubkey)}
        <PersonInfo person={getPersonWithFallback(pubkey)} />
      {:else}
        <div class="flex flex-col items-center gap-4 my-8">
          <div class="text-xl flex gap-2 items-center">
            <i class="fa fa-triangle-exclamation fa-light" />
            You aren't yet following anyone.
          </div>
          <div>Search below to find some interesting people.</div>
        </div>
      {/each}
      <PersonSearch hideFollows />
    </Content>
  </Modal>
{:else if needsPeople()}
  <Content size="lg">
    <div class="mt-12 flex flex-col items-center gap-4">
      <div class="flex items-center gap-2 text-xl">
        <i class="fa fa-triangle-exclamation fa-light" />
        You aren't yet following anyone.
      </div>
      <div>
        Click <Anchor href="/search">here</Anchor> to find some interesting people.
      </div>
    </div>
  </Content>
{:else}
  <slot />
{/if}
