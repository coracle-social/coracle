<script lang="ts">
  import {modal, menuIsOpen} from "src/app/ui"
  import Modal from "src/ui/partials/Modal.svelte"
  import Content from "src/ui/partials/Content.svelte"
  import Spinner from "src/ui/partials/Spinner.svelte"
  import ChatEdit from "src/ui/views/chat/ChatEdit.svelte"
  import ConnectUser from "src/ui/views/login/ConnectUser.svelte"
  import PrivKeyLogin from "src/ui/views/login/PrivKeyLogin.svelte"
  import PubKeyLogin from "src/ui/views/login/PubKeyLogin.svelte"
  import Onboarding from "src/ui/views/onboarding/Onboarding.svelte"
  import NoteCreate from "src/ui/views/notes/NoteCreate.svelte"
  import NoteDetail from "src/ui/views/notes/NoteDetail.svelte"
  import PersonList from "src/ui/views/person/PersonList.svelte"
  import PersonProfileInfo from "src/ui/views/person/PersonProfileInfo.svelte"
  import PersonShare from "src/ui/views/person/PersonShare.svelte"
  import AddRelay from "src/ui/views/relays/AddRelay.svelte"

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
      <PrivKeyLogin />
    {:else if $modal.type === "login/pubkey"}
      <PubKeyLogin />
    {:else if $modal.type === "login/connect"}
      <ConnectUser />
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
