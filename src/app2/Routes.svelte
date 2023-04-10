<script lang="ts">
  import {Route} from "svelte-routing"
  import {onReady} from "src/agent/tables"
  import EnsureData from "src/app2/EnsureData.svelte"
  import Notifications from "src/app2/views/Notifications.svelte"
  import Bech32Entity from "src/app2/views/Bech32Entity.svelte"
  import ChatDetail from "src/app2/views/ChatDetail.svelte"
  import ChatList from "src/app2/views/ChatList.svelte"
  import Feeds from "src/app2/views/Feeds.svelte"
  import UserKeys from "src/app2/views/UserKeys.svelte"
  import Login from "src/app2/views/Login.svelte"
  import Logout from "src/app2/views/Logout.svelte"
  import MessagesDetail from "src/app2/views/MessagesDetail.svelte"
  import MessagesList from "src/app2/views/MessagesList.svelte"
  import NotFound from "src/app2/views/NotFound.svelte"
  import PersonDetail from "src/app2/views/PersonDetail.svelte"
  import Search from "src/app2/views/Search.svelte"
  import Scan from "src/app2/views/Scan.svelte"
  import RelayDetail from "src/app2/views/RelayDetail.svelte"
  import RelayList from "src/app2/views/RelayList.svelte"
  import UserProfile from "src/app2/views/UserProfile.svelte"
  import UserSettings from "src/app2/views/UserSettings.svelte"

  let ready = false

  onReady(() => {
    ready = true
  })
</script>

{#if ready}
  <div class="pt-16 text-gray-3 lg:ml-56">
    <Route path="/notifications" component={Notifications} />
    <Route path="/search">
      <EnsureData enforcePeople={false}>
        <Search />
      </EnsureData>
    </Route>
    <Route path="/scan">
      <EnsureData enforcePeople={false}>
        <Scan />
      </EnsureData>
    </Route>
    <Route path="/notes/:activeTab" let:params>
      <EnsureData>
        <Feeds activeTab={params.activeTab} />
      </EnsureData>
    </Route>
    <Route path="/people/:npub/:activeTab" let:params>
      {#key params.npub}
        <PersonDetail npub={params.npub} activeTab={params.activeTab} />
      {/key}
    </Route>
    <Route path="/chat" component={ChatList} />
    <Route path="/chat/:entity" let:params>
      {#key params.entity}
        <ChatDetail entity={params.entity} />
      {/key}
    </Route>
    <Route path="/messages" component={MessagesList} />
    <Route path="/messages/:entity" let:params>
      {#key params.entity}
        <MessagesDetail entity={params.entity} />
      {/key}
    </Route>
    <Route path="/keys" component={UserKeys} />
    <Route path="/relays" component={RelayList} />
    <Route path="/relays/:b64url" let:params>
      {#key params.b64url}
        <RelayDetail url={atob(params.b64url)} />
      {/key}
    </Route>
    <Route path="/profile" component={UserProfile} />
    <Route path="/settings" component={UserSettings} />
    <Route path="/login" component={Login} />
    <Route path="/logout" component={Logout} />
    <Route path="/:entity" let:params>
      {#key params.entity}
        <Bech32Entity entity={params.entity} />
      {/key}
    </Route>
    <Route path="*" component={NotFound} />
  </div>
{/if}
