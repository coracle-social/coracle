<script lang="ts">
  import {whereEq} from "ramda"
  import {ucFirst} from "hurdak"
  import {themeBackgroundGradient} from "src/partials/state"
  import Tabs from "src/partials/Tabs.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import GroupCircle from "src/app/shared/GroupCircle.svelte"
  import GroupActions from "src/app/shared/GroupActions.svelte"
  import GroupAbout from "src/app/shared/GroupAbout.svelte"
  import GroupNotes from "src/app/shared/GroupNotes.svelte"
  import GroupCalendar from "src/app/shared/GroupCalendar.svelte"
  import GroupMarket from "src/app/shared/GroupMarket.svelte"
  import GroupMembers from "src/app/shared/GroupMembers.svelte"
  import GroupAdmin from "src/app/shared/GroupAdmin.svelte"
  import GroupRestrictAccess from "src/app/shared/GroupRestrictAccess.svelte"
  import {displayGroupMeta} from "src/domain"
  import {
    env,
    GroupAccess,
    loadPubkeys,
    groupRequests,
    deriveGroup,
    deriveGroupMeta,
    deriveAdminKeyForGroup,
    deriveSharedKeyForGroup,
    deriveIsGroupMember,
    deriveGroupStatus,
    loadGroups,
    loadGroupMessages,
  } from "src/engine"
  import {router} from "src/app/util/router"

  export let address
  export let relays = null
  export let activeTab = "notes"
  export let claim = ""

  const group = deriveGroup(address)
  const meta = deriveGroupMeta(address)
  const status = deriveGroupStatus(address)
  const isGroupMember = deriveIsGroupMember(address)
  const sharedKey = deriveSharedKeyForGroup(address)
  const adminKey = deriveAdminKeyForGroup(address)
  const requests = groupRequests.derived(requests =>
    requests.filter(whereEq({group: address, resolved: false})),
  )

  const setActiveTab = tab =>
    router
      .at("groups")
      .of(address)
      .at(tab)
      .push({key: router.getKey(router.current.get())})

  loadGroups([address], relays || [])

  let tabs

  $: key = $group && $isGroupMember

  $: {
    if (key) {
      loadGroupMessages([address])
      loadPubkeys($group.members || [])
    }
  }

  $: {
    tabs = ["notes"]

    if (!$env.FORCE_GROUP) {
      tabs.push("calendar")
      tabs.push("market")
    }

    if ($sharedKey || address.startsWith("34550")) {
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

  $: ({rgb, rgba} = $themeBackgroundGradient)

  document.title = $meta?.name || "Group Detail"
</script>

<div
  class="absolute left-0 top-0 h-64 w-full"
  style={`z-index: -1;
         background-size: cover;
         background-image: linear-gradient(to bottom, ${rgba}, ${rgb}), url('${$meta?.banner}')`} />

<div class="flex gap-4 text-neutral-100">
  <GroupCircle {address} class="mt-1 h-10 w-10 sm:h-32 sm:w-32" />
  <div class="flex min-w-0 flex-grow flex-col gap-4">
    <div class="flex items-center justify-between gap-4">
      <Anchor on:click={() => setActiveTab("notes")} class="text-2xl"
        >{displayGroupMeta($meta)}</Anchor>
      <GroupActions {address} {claim} />
    </div>
    <GroupAbout {address} />
  </div>
</div>

{#if tabs.length > 1}
  <Tabs {tabs} {activeTab} {setActiveTab}>
    <div slot="tab" let:tab class="flex gap-2">
      <div>{ucFirst(tab)}</div>
      {#if tab === "admin" && $requests.length > 0}
        <div class="h-6 rounded-full bg-neutral-700 px-2">
          {$requests.length}
        </div>
      {/if}
    </div>
  </Tabs>
{/if}

{#key key}
  {#if address.startsWith("35834") && $status.access !== GroupAccess.Granted}
    <GroupRestrictAccess {address} />
  {:else if activeTab === "notes"}
    <GroupNotes {address} />
  {:else if activeTab === "calendar"}
    <GroupCalendar {address} />
  {:else if activeTab === "market"}
    <GroupMarket {address} />
  {:else if activeTab === "members"}
    <GroupMembers {address} />
  {:else if activeTab === "admin"}
    <GroupAdmin {address} />
  {/if}
{/key}
