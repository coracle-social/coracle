<script>
  import {onMount} from "svelte"
  import {now} from "paravel"
  import {whereEq, assocPath, without} from "ramda"
  import {noteKinds, LOCAL_RELAY_URL} from "src/util/nostr"
  import {getKey} from "src/util/router"
  import {themeBackgroundGradient} from "src/partials/state"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Tabs from "src/partials/Tabs.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Calendar from "src/app/shared/Calendar.svelte"
  import GroupCircle from "src/app/shared/GroupCircle.svelte"
  import GroupActions from "src/app/shared/GroupActions.svelte"
  import GroupAbout from "src/app/shared/GroupAbout.svelte"
  import GroupRequest from "src/app/shared/GroupRequest.svelte"
  import GroupMember from "src/app/shared/GroupMember.svelte"
  import GroupMarket from "src/app/shared/GroupMarket.svelte"
  import NoteCreateInline from "src/app/shared/NoteCreateInline.svelte"
  import Feed from "src/app/shared/Feed.svelte"
  import {
    env,
    canSign,
    GroupAccess,
    displayGroup,
    session,
    subscribe,
    loadPubkeys,
    publishGroupEntryRequest,
    groupRequests,
    deriveGroup,
    getGroupReqInfo,
    deriveAdminKeyForGroup,
    deriveSharedKeyForGroup,
    deriveGroupStatus,
    updateCurrentSession,
    loadGroups,
  } from "src/engine"
  import {router} from "src/app/router"

  export let address, activeTab
  export let relays = null

  const group = deriveGroup(address)
  const status = deriveGroupStatus(address)
  const sharedKey = deriveSharedKeyForGroup(address)
  const adminKey = deriveAdminKeyForGroup(address)
  const requests = groupRequests.derived(requests =>
    requests.filter(whereEq({group: address, resolved: false})),
  )

  const info = getGroupReqInfo(address)

  const setActiveTab = tab =>
    router
      .at("groups")
      .of(address)
      .at(tab)
      .push({key: getKey(router.current.get())})

  onMount(() => {
    loadGroups([address], relays)

    updateCurrentSession(assocPath(["groups", address, "last_synced"], now()))

    if (address.startsWith("35834:")) {
      const sub = subscribe({
        relays,
        filters: [{kinds: [1059, 1060], "#p": info.recipients, since: info.since}],
      })

      return () => sub.close()
    }
  })

  $: ({rgb, rgba} = $themeBackgroundGradient)

  let tabs

  $: relays = relays || info.relays
  $: loadPubkeys($group.members || [])

  $: {
    tabs = ["notes"]

    if (!$env.FORCE_GROUP) {
      tabs.push("calendar")
      tabs.push("market")
    }

    if ($sharedKey) {
      tabs.push("members")
    } else if (activeTab === "members") {
      activeTab = "notes"
    }

    if ($adminKey && address.startsWith("35834")) {
      tabs.push("admin")
    } else if (activeTab === "admin") {
      activeTab = "notes"
    }
  }

  document.title = $group?.name || "Group Detail"
</script>

<div
  class="absolute left-0 top-0 h-64 w-full"
  style={`z-index: -1;
         background-size: cover;
         background-image: linear-gradient(to bottom, ${rgba}, ${rgb}), url('${$group?.meta?.banner}')`} />

<div class="flex gap-4 text-lightest">
  <GroupCircle {address} class="mt-1 h-10 w-10 sm:h-32 sm:w-32" />
  <div class="flex min-w-0 flex-grow flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <Anchor on:click={() => setActiveTab("notes")} class="text-2xl"
        >{displayGroup($group)}</Anchor>
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

{#if address.startsWith("35834") && $status.access !== GroupAccess.Granted}
  <p class="m-auto max-w-sm py-12 text-center">
    {#if $status.access === GroupAccess.Requested}
      Your access request is awaiting approval.
    {:else}
      You don't have access to this group.
    {/if}
    {#if $session && !$status.access}
      Click <Anchor underline on:click={() => publishGroupEntryRequest(address)}>here</Anchor> to request
      entry.
    {/if}
  </p>
{:else if activeTab === "notes"}
  {#if $canSign}
    <NoteCreateInline group={address} />
  {/if}
  <Feed
    shouldListen
    hideControls
    filter={{kinds: without([30402], noteKinds), "#a": [address]}}
    relays={address.startsWith("35834:") ? [LOCAL_RELAY_URL] : relays} />
{:else if activeTab === "calendar"}
  <Calendar group={address} filters={[{kinds: [31923], "#a": [address]}]} {relays} />
{:else if activeTab === "market"}
  <GroupMarket group={address} {relays} />
{:else if activeTab === "members"}
  <FlexColumn>
    {#each $group.members || [] as pubkey (pubkey)}
      <GroupMember {address} {pubkey} />
    {:else}
      <p class="text-center py-12">No members found.</p>
    {/each}
  </FlexColumn>
{:else if activeTab === "admin"}
  {#each $requests as request (request.id)}
    <GroupRequest {address} {request} />
  {:else}
    <p class="text-center py-12">No action items found.</p>
  {/each}
{/if}
