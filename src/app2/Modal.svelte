<script lang="ts">
  import {menuIsOpen} from "src/app/ui"
  import {modal} from "src/partials/state"
  import Modal from "src/partials/Modal.svelte"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import ChatEdit from "src/app2/views/ChatEdit.svelte"
  import LoginConnect from "src/app2/views/LoginConnect.svelte"
  import LoginPrivKey from "src/app2/views/LoginPrivKey.svelte"
  import LoginPubKey from "src/app2/views/LoginPubKey.svelte"
  import Onboarding from "src/app2/views/Onboarding.svelte"
  import NoteCreate from "src/app2/views/NoteCreate.svelte"
  import NoteDetail from "src/app2/views/NoteDetail.svelte"
  import PersonList from "src/app2/shared/PersonList.svelte"
  import PersonProfileInfo from "src/app2/views/PersonProfileInfo.svelte"
  import PersonShare from "src/app2/views/PersonShare.svelte"
  import AddRelay from "src/app2/views/RelayAdd.svelte"

  const closeModal = async () => {
    modal.clear()
    menuIsOpen.set(false)
  }
</script>

{#if $modal}
  <Modal onEscape={$modal.noEscape ? null : closeModal}>
    {#if $modal.type === "note/detail"}
      {#key $modal.note.id}
        <NoteDetail {...$modal} invertColors />
      {/key}
    {:else if $modal.type === "note/create"}
      <NoteCreate pubkey={$modal.pubkey} nevent={$modal.nevent} />
    {:else if $modal.type === "relay/add"}
      <AddRelay />
    {:else if $modal.type === "onboarding"}
      <Onboarding stage={$modal.stage} />
    {:else if $modal.type === "room/edit"}
      <ChatEdit {...$modal} />
    {:else if $modal.type === "login/privkey"}
      <LoginPrivKey />
    {:else if $modal.type === "login/pubkey"}
      <LoginPubKey />
    {:else if $modal.type === "login/connect"}
      <LoginConnect />
    {:else if $modal.type === "person/info"}
      <PersonProfileInfo person={$modal.person} />
    {:else if $modal.type === "person/share"}
      <PersonShare person={$modal.person} />
    {:else if $modal.type === "person/follows"}
      <PersonList type="follows" pubkey={$modal.pubkey} />
    {:else if $modal.type === "person/followers"}
      <PersonList type="followers" pubkey={$modal.pubkey} />
    {:else if $modal.type === "message"}
      <Content size="lg">
        <div class="text-center">{$modal.message}</div>
        {#if $modal.spinner}
          <Spinner delay={0} />
        {/if}
      </Content>
    {/if}
  </Modal>
{/if}
