<script>
  import Anchor from "src/partials/Anchor.svelte"
  import Content from "src/partials/Content.svelte"
  import Modal from "src/partials/Modal.svelte"
  import RelaySearch from "src/partials/RelaySearch.svelte"
  import SearchPeople from "src/views/SearchPeople.svelte"
  import {relays} from 'src/agent/relays'
  import {follows} from 'src/agent/user'

  export let enforceRelays = true
  export let enforcePeople = true

  const {petnames} = follows

  let modalIsOpen = true

  const closeModal = () => {
    modalIsOpen = false
  }
</script>

{#if $relays.length === 0 && enforceRelays}
  {#if modalIsOpen}
  <Modal onEscape={closeModal}>
    <Content>
      <div class="flex flex-col items-center gap-4 my-8">
        <div class="text-xl flex gap-2 items-center">
          <i class="fa fa-triangle-exclamation fa-light" />
          You aren't yet connected to any relays.
        </div>
        <div>
         Search below to find one to join.
        </div>
      </div>
      <RelaySearch />
    </Content>
  </Modal>
  {:else}
  <Content size="lg">
    <div class="flex flex-col items-center gap-4 mt-12">
      <div class="text-xl flex gap-2 items-center">
        <i class="fa fa-triangle-exclamation fa-light" />
        You aren't yet connected to any relays.
      </div>
      <div>
       Click <Anchor href="/relays">here</Anchor> to find one to join.
      </div>
    </div>
  </Content>
  {/if}
{:else if $petnames.length === 0 && enforcePeople}
  {#if modalIsOpen}
  <Modal onEscape={closeModal}>
    <Content>
      <div class="flex flex-col items-center gap-4 my-8">
        <div class="text-xl flex gap-2 items-center">
          <i class="fa fa-triangle-exclamation fa-light" />
          You aren't yet following anyone.
        </div>
        <div>
         Search below to find some interesting people.
        </div>
      </div>
      <SearchPeople />
    </Content>
  </Modal>
  {:else}
  <Content size="lg">
    <div class="flex flex-col items-center gap-4 mt-12">
      <div class="text-xl flex gap-2 items-center">
        <i class="fa fa-triangle-exclamation fa-light" />
        You aren't yet following anyone.
      </div>
      <div>
       Click <Anchor href="/search/people">here</Anchor> to find some
       interesting people.
      </div>
    </div>
  </Content>
  {/if}
{:else}
<slot />
{/if}
