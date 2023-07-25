<script lang="ts">
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import ChatEdit from "src/app/views/ChatEdit.svelte"
  import LoginConnect from "src/app/views/LoginConnect.svelte"
  import LoginPrivKey from "src/app/views/LoginPrivKey.svelte"
  import LoginAdvanced from "src/app/views/LoginAdvanced.svelte"
  import LoginPubKey from "src/app/views/LoginPubKey.svelte"
  import LoginBunker from "src/app/views/LoginBunker.svelte"
  import Onboarding from "src/app/views/Onboarding.svelte"
  import NoteCreate from "src/app/views/NoteCreate.svelte"
  import NoteZap from "src/app/views/NoteZap.svelte"
  import NoteShare from "src/app/views/NoteShare.svelte"
  import PublishInfo from "src/app/views/PublishInfo.svelte"
  import NoteDetail from "src/app/views/NoteDetail.svelte"
  import PersonFeed from "src/app/views/PersonFeed.svelte"
  import PersonList from "src/app/shared/PersonList.svelte"
  import PersonProfileInfo from "src/app/views/PersonProfileInfo.svelte"
  import PersonShare from "src/app/views/PersonShare.svelte"
  import TopicFeed from "src/app/views/TopicFeed.svelte"
  import ListList from "src/app/views/ListList.svelte"
  import ListSelect from "src/app/views/ListSelect.svelte"
  import ListEdit from "src/app/views/ListEdit.svelte"
  import RelayBrowse from "src/app/views/RelayBrowse.svelte"
  import RelayDetail from "src/app/views/RelayDetail.svelte"
  import RelayReview from "src/app/views/RelayReview.svelte"

  export let m
</script>

{#if m.type === "note/detail"}
  {#key m.note.id}
    <NoteDetail note={m.note} relays={m.relays} invertColors />
  {/key}
{:else if m.type === "note/create"}
  <NoteCreate pubkey={m.pubkey} quote={m.quote} writeTo={m.relays} />
{:else if m.type === "note/zap"}
  <NoteZap note={m.note} />
{:else if m.type === "note/share"}
  <NoteShare note={m.note} />
{:else if m.type === "publish/info"}
  <PublishInfo event={m.event} progress={m.progress} />
{:else if m.type === "relay/browse"}
  <RelayBrowse />
{:else if m.type === "relay/detail"}
  <RelayDetail url={m.url} />
{:else if m.type === "relay/review"}
  <RelayReview url={m.url} />
{:else if m.type === "onboarding"}
  <Onboarding stage={m.stage} />
{:else if m.type === "channel/edit"}
  <ChatEdit {...m} />
{:else if m.type === "login/privkey"}
  <LoginPrivKey />
{:else if m.type === "login/advanced"}
  <LoginAdvanced />
{:else if m.type === "login/pubkey"}
  <LoginPubKey />
{:else if m.type === "login/bunker"}
  <LoginBunker />
{:else if m.type === "login/connect"}
  <LoginConnect />
{:else if m.type === "person/feed"}
  <PersonFeed pubkey={m.pubkey} />
{:else if m.type === "person/info"}
  <PersonProfileInfo pubkey={m.pubkey} />
{:else if m.type === "person/share"}
  <PersonShare pubkey={m.pubkey} />
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
