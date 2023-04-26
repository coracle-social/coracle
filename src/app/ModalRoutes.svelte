<script lang="ts">
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import ChatEdit from "src/app/views/ChatEdit.svelte"
  import LoginConnect from "src/app/views/LoginConnect.svelte"
  import LoginPrivKey from "src/app/views/LoginPrivKey.svelte"
  import LoginPubKey from "src/app/views/LoginPubKey.svelte"
  import Onboarding from "src/app/views/Onboarding.svelte"
  import NoteCreate from "src/app/views/NoteCreate.svelte"
  import NoteZap from "src/app/views/NoteZap.svelte"
  import NoteDetail from "src/app/views/NoteDetail.svelte"
  import PersonFeed from "src/app/views/PersonFeed.svelte"
  import PersonList from "src/app/shared/PersonList.svelte"
  import PersonProfileInfo from "src/app/views/PersonProfileInfo.svelte"
  import PersonShare from "src/app/views/PersonShare.svelte"
  import TopicFeed from "src/app/views/TopicFeed.svelte"
  import ListList from "src/app/views/ListList.svelte"
  import ListSelect from "src/app/views/ListSelect.svelte"
  import ListEdit from "src/app/views/ListEdit.svelte"
  import RelayAdd from "src/app/views/RelayAdd.svelte"

  export let m
</script>

{#if m.type === "note/detail"}
  {#key m.note.id}
    <NoteDetail {...m} invertColors />
  {/key}
{:else if m.type === "note/create"}
  <NoteCreate pubkey={m.pubkey} nevent={m.nevent} />
{:else if m.type === "note/zap"}
  <NoteZap note={m.note} />
{:else if m.type === "relay/add"}
  <RelayAdd url={m.url} />
{:else if m.type === "onboarding"}
  <Onboarding stage={m.stage} />
{:else if m.type === "room/edit"}
  <ChatEdit {...m} />
{:else if m.type === "login/privkey"}
  <LoginPrivKey />
{:else if m.type === "login/pubkey"}
  <LoginPubKey />
{:else if m.type === "login/connect"}
  <LoginConnect />
{:else if m.type === "person/feed"}
  <PersonFeed pubkey={m.pubkey} />
{:else if m.type === "person/info"}
  <PersonProfileInfo person={m.person} />
{:else if m.type === "person/share"}
  <PersonShare person={m.person} />
{:else if m.type === "person/follows"}
  <PersonList type="follows" pubkey={m.pubkey} />
{:else if m.type === "person/followers"}
  <PersonList type="followers" pubkey={m.pubkey} />
{:else if m.type === "topic/feed"}
  {#key m.topic}
    <TopicFeed topic={m.topic} />
  {/key}
{:else if m.type === "list/list"}
  <ListList />
{:else if m.type === "list/select"}
  <ListSelect item={m.item} />
{:else if m.type === "list/edit"}
  <ListEdit list={m.list} />
{:else if m.type === "message"}
  <Content size="lg">
    <div class="text-center">{m.message}</div>
    {#if m.spinner}
      <Spinner delay={0} />
    {/if}
  </Content>
{/if}
