<script lang="ts">
  import {Route} from "svelte-routing"
  import {onReady} from "src/agent/tables"
  import Notifications from "src/ui/routes/Notifications.svelte"
  import Bech32Entity from "src/ui/routes/Bech32Entity.svelte"
  import ChatDetail from "src/ui/routes/ChatDetail.svelte"
  import ChatList from "src/ui/routes/ChatList.svelte"
  import Debug from "src/ui/routes/Debug.svelte"
  import Feeds from "src/ui/routes/Feeds.svelte"
  import Keys from "src/ui/routes/Keys.svelte"
  import Login from "src/ui/routes/Login.svelte"
  import Logout from "src/ui/routes/Logout.svelte"
  import MessagesDetail from "src/ui/routes/MessagesDetail.svelte"
  import MessagesList from "src/ui/routes/MessagesList.svelte"
  import NotFound from "src/ui/routes/NotFound.svelte"
  import PersonDetail from "src/ui/routes/PersonDetail.svelte"
  import Search from "src/ui/routes/Search.svelte"
  import Scan from "src/ui/routes/Scan.svelte"
  import RelayDetail from "src/ui/routes/RelayDetail.svelte"
  import RelayList from "src/ui/routes/RelayList.svelte"
  import EnsureData from "src/ui/views/EnsureData.svelte"
  import Profile from "src/ui/views/Profile.svelte"
  import Settings from "src/ui/views/Settings.svelte"

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
    <Route path="/keys" component={Keys} />
    <Route path="/relays" component={RelayList} />
    <Route path="/relays/:b64url" let:params>
      {#key params.b64url}
        <RelayDetail url={atob(params.b64url)} />
      {/key}
    </Route>
    <Route path="/profile" component={Profile} />
    <Route path="/settings" component={Settings} />
    <Route path="/login" component={Login} />
    <Route path="/logout" component={Logout} />
    <Route path="/debug" component={Debug} />
    <Route path="/:entity" let:params>
      {#key params.entity}
        <Bech32Entity entity={params.entity} />
      {/key}
    </Route>
    <Route path="*" component={NotFound} />
  </div>
{/if}
