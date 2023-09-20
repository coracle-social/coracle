<script lang="ts">
  import {nip19} from "nostr-tools"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import ChatEdit from "src/app/views/ChatEdit.svelte"
  import ChannelCreate from "src/app/views/ChannelCreate.svelte"
  import Login from "src/app/views/Login.svelte"
  import LoginConnect from "src/app/views/LoginConnect.svelte"
  import LoginPrivKey from "src/app/views/LoginPrivKey.svelte"
  import LoginAdvanced from "src/app/views/LoginAdvanced.svelte"
  import LoginPubKey from "src/app/views/LoginPubKey.svelte"
  import LoginBunker from "src/app/views/LoginBunker.svelte"
  import Onboarding from "src/app/views/Onboarding.svelte"
  import NoteCreate from "src/app/views/NoteCreate.svelte"
  import ZapModal from "src/app/views/ZapModal.svelte"
  import PublishInfo from "src/app/views/PublishInfo.svelte"
  import NoteDetail from "src/app/views/NoteDetail.svelte"
  import ThreadDetail from "src/app/views/ThreadDetail.svelte"
  import PersonDetail from "src/app/views/PersonDetail.svelte"
  import PersonList from "src/app/shared/PersonList.svelte"
  import PersonList2 from "src/app/shared/PersonList2.svelte"
  import PersonInfo from "src/app/views/PersonInfo.svelte"
  import TopicFeed from "src/app/views/TopicFeed.svelte"
  import ListList from "src/app/views/ListList.svelte"
  import ListSelect from "src/app/views/ListSelect.svelte"
  import ListEdit from "src/app/views/ListEdit.svelte"
  import LabelCreate from "src/app/views/LabelCreate.svelte"
  import LabelDetail from "src/app/views/LabelDetail.svelte"
  import ReportCreate from "src/app/views/ReportCreate.svelte"
  import DataImport from "src/app/views/DataImport.svelte"
  import DataExport from "src/app/views/DataExport.svelte"
  import RelayBrowse from "src/app/views/RelayBrowse.svelte"
  import RelayDetail from "src/app/views/RelayDetail.svelte"
  import RelayReview from "src/app/views/RelayReview.svelte"
  import Bech32Entity from "src/app/views/Bech32Entity.svelte"
  import QRCode from "src/app/views/QRCode.svelte"

  export let m
</script>

{#if m.type === "note/detail"}
  {#key m.note.id}
    <NoteDetail note={m.note} relays={m.relays} invertColors />
  {/key}
{:else if m.type === "note/create"}
  <NoteCreate pubkey={m.pubkey} quote={m.quote} writeTo={m.relays} />
{:else if m.type === "zap/create"}
  <ZapModal pubkey={m.pubkey} note={m.note} />
{:else if m.type === "thread/detail"}
  <ThreadDetail anchorId={m.anchorId} relays={m.relays} />
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
{:else if m.type === "channel/create"}
  <ChannelCreate />
{:else if m.type === "chat/edit"}
  <ChatEdit {...m} />
{:else if m.type === "login/intro"}
  <Login />
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
{:else if m.type === "person/detail"}
  <PersonDetail npub={nip19.npubEncode(m.pubkey)} />
{:else if m.type === "person/info"}
  <PersonInfo pubkey={m.pubkey} />
{:else if m.type === "person/list"}
  <PersonList2 pubkeys={m.pubkeys} />
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
{:else if m.type === "label/create"}
  <LabelCreate note={m.note} />
{:else if m.type === "label/detail"}
  <LabelDetail label={m.label} ids={m.ids} hints={m.hints} />
{:else if m.type === "report/create"}
  <ReportCreate note={m.note} />
{:else if m.type === "data/export"}
  <DataExport />
{:else if m.type === "data/import"}
  <DataImport />
{:else if m.type === "bech32"}
  <Bech32Entity entity={m.entity} />
{:else if m.type === "qrcode"}
  <QRCode value={m.value} />
{:else if m.type === "message"}
  <Content size="lg">
    <div class="text-center">{m.message}</div>
    {#if m.spinner}
      <Spinner delay={0} />
    {/if}
  </Content>
{/if}
