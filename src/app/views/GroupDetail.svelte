<script>
  import {onMount} from "svelte"
  import {now} from "paravel"
  import {whereEq, assocPath, without, uniq} from "ramda"
  import {noteKinds} from "src/util/nostr"
  import {getKey} from "src/util/router"
  import {getThemeBackgroundGradient} from "src/partials/state"
  import Content from "src/partials/Content.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import GroupCircle from "src/app/shared/GroupCircle.svelte"
  import GroupActions from "src/app/shared/GroupActions.svelte"
  import GroupAbout from "src/app/shared/GroupAbout.svelte"
  import GroupRequest from "src/app/shared/GroupRequest.svelte"
  import GroupMember from "src/app/shared/GroupMember.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {
    GroupAccess,
    MemberAccess,
    displayGroup,
    groups,
    subscribe,
    joinGroup,
    groupRequests,
    getGroupReqInfo,
    deriveAdminKeyForGroup,
    deriveSharedKeyForGroup,
    getRelaysFromFilters,
    deriveGroupStatus,
    deriveGroupAccess,
    updateCurrentSession,
  } from "src/engine"
  import {router} from "src/app/router"

  export let address, activeTab

  const {rgb, rgba} = getThemeBackgroundGradient()
  const group = groups.key(address)
  const access = deriveGroupAccess(address)
  const status = deriveGroupStatus(address)
  const sharedKey = deriveSharedKeyForGroup(address)
  const adminKey = deriveAdminKeyForGroup(address)
  const filter = {kinds: noteKinds, "#a": [address]}
  const relays = getRelaysFromFilters([filter])
  const requests = groupRequests.derived(requests =>
    requests.filter(whereEq({group: address, resolved: false}))
  )

  const setActiveTab = tab =>
    router
      .at("groups")
      .of(address)
      .at(tab)
      .push({key: getKey(router.current.get())})

  onMount(() => {
    const {recipients, relays, since} = getGroupReqInfo(address)

    updateCurrentSession(assocPath(["groups", address, "last_synced"], now()))

    const sub = subscribe({relays, filters: [{kinds: [1059], "#p": recipients, since}]})

    return () => sub.close()
  })

  $: members = uniq(
    without([$group?.pubkey], ($sharedKey?.members || []).concat($adminKey?.members || []))
  )

  let tabs

  $: {
    tabs = ["notes"]

    if ($sharedKey) {
      tabs.push("members")
    } else if (activeTab === "members") {
      activeTab = "notes"
    }

    if ($adminKey) {
      tabs.push("admin")
    } else if (activeTab === "admin") {
      activeTab = "notes"
    }
  }

  document.title = $group?.name || "Group Detail"
</script>

<div
  class="absolute left-0 h-64 w-full"
  style={`z-index: -1;
         background-size: cover;
         background-image: linear-gradient(to bottom, ${rgba}, ${rgb}), url('${$group?.meta?.banner}')`} />

<Content>
  <div class="flex gap-4 text-gray-1">
    <GroupCircle {address} class="mt-1 h-12 w-12 sm:h-32 sm:w-32" />
    <div class="flex min-w-0 flex-grow flex-col gap-4">
      <div class="flex items-center justify-between gap-4">
        <span class="text-2xl">{displayGroup($group)}</span>
        <div class="hidden xs:block">
          <GroupActions {address} />
        </div>
      </div>
      <GroupAbout {address} />
    </div>
  </div>

  {#if tabs.length > 1}
    <Tabs {tabs} {activeTab} {setActiveTab} />
  {/if}

  {#if $access === GroupAccess.Closed && $status.access !== MemberAccess.Granted}
    <p class="m-auto max-w-sm py-12 text-center">
      {#if $status.access === MemberAccess.Requested}
        Your access request is awaiting approval.
      {:else}
        You don't have access to this group.
      {/if}
      {#if !$status.access}
        Click <Anchor theme="anchor" on:click={() => joinGroup(address)}>here</Anchor> to request entry.
      {/if}
    </p>
  {:else if activeTab === "notes"}
    <Feed shouldListen hideControls {filter} {relays} />
  {:else if activeTab === "members"}
    {#each members as pubkey (pubkey)}
      <GroupMember {address} {pubkey} />
    {:else}
      <p class="text-center py-12">No members found.</p>
    {/each}
  {:else if activeTab === "admin"}
    {#each $requests as request (request.id)}
      <GroupRequest {address} {request} />
    {:else}
      <p class="text-center py-12">No action items found.</p>
    {/each}
  {/if}
</Content>
