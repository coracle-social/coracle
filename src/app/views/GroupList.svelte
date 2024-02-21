<script>
  import {onMount, onDestroy} from "svelte"
  import {derived} from "svelte/store"
  import {partition, assoc} from "ramda"
  import {now} from "paravel"
  import {fuzzy, createScroller} from "src/util/misc"
  import {getModal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Input from "src/partials/Input.svelte"
  import GroupListItem from "src/app/shared/GroupListItem.svelte"
  import {
    load,
    groups,
    getUserHints,
    getGroupReqInfo,
    deriveIsGroupMember,
    updateCurrentSession,
    selectHintsWithFallback,
    session,
  } from "src/engine"

  const loadMore = async () => {
    limit += 50
  }

  const scroller = createScroller(loadMore, {element: getModal()})

  const groupList = derived([groups, session], ([$groups, $session]) => {
    const [joined, other] = partition(g => deriveIsGroupMember(g.address, true).get(), $groups)

    return {joined, other}
  })

  let q = ""
  let limit = 50

  $: searchGroups = fuzzy($groupList.other, {
    keys: [{name: "id", weight: 0.2}, "meta.name", "meta.description"],
  })

  document.title = "Groups"

  onMount(() => {
    const {admins, recipients, relays, since} = getGroupReqInfo()

    updateCurrentSession(assoc("groups_last_synced", now()))

    load({
      relays: selectHintsWithFallback(relays),
      filters: [{kinds: [1059, 1060], "#p": recipients, since}],
    })

    load({
      relays: getUserHints("read"),
      filters: [
        {kinds: [35834, 34550], authors: admins},
        {kinds: [35834, 34550], limit: 500},
      ],
    })
  })

  onDestroy(() => {
    scroller.stop()
  })
</script>

<div class="flex justify-between">
  <div class="flex items-center gap-2">
    <i class="fa fa-circle-nodes fa-lg" />
    <h2 class="staatliches text-2xl">Your groups</h2>
  </div>
  <Anchor modal button accent href="/groups/new">
    <i class="fa-solid fa-plus" /> Create
  </Anchor>
</div>
{#each $groupList.joined as group (group.address)}
  <GroupListItem address={group.address} />
{:else}
  <p class="text-center py-8">You haven't yet joined any groups.</p>
{/each}
<div class="mb-2 border-b border-solid border-neutral-600 pt-2" />
<Input bind:value={q} type="text" wrapperClass="flex-grow" placeholder="Search groups">
  <i slot="before" class="fa-solid fa-search" />
</Input>
{#each searchGroups(q).slice(0, limit) as group (group.address)}
  <GroupListItem address={group.address} />
{/each}
