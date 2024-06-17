<script>
  import {onMount} from "svelte"
  import {filter, assoc} from "ramda"
  import {now, shuffle} from "@welshman/lib"
  import {GROUP, COMMUNITY, getIdFilters} from "@welshman/util"
  import {createScroller} from "src/util/misc"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Input from "src/partials/Input.svelte"
  import GroupListItem from "src/app/shared/GroupListItem.svelte"
  import {
    load,
    hints,
    groups,
    repository,
    loadGiftWraps,
    loadGroupMessages,
    deriveIsGroupMember,
    updateCurrentSession,
    communityListsByAddress,
    searchGroups,
  } from "src/engine"

  const loadMore = async () => {
    limit += 20
  }

  const userIsMember = g => deriveIsGroupMember(g.address, true).get()

  const userGroups = groups.derived(
    filter(g => !repository.deletes.has(g.address) && userIsMember(g)),
  )

  let q = ""
  let limit = 20
  let element = null

  $: otherGroups = $searchGroups(q)
    .filter(g => !userIsMember(g))
    .slice(0, limit)

  document.title = "Groups"

  onMount(() => {
    const loader = loadGiftWraps()
    const scroller = createScroller(loadMore, {element})
    const communityAddrs = Array.from($communityListsByAddress.keys())
      .filter(a => !groups.key(a).get()?.meta)

    updateCurrentSession(assoc("groups_last_synced", now()))

    loadGroupMessages()

    load({
      skipCache: true,
      relays: hints.User().getUrls(),
      filters: [{kinds: [GROUP, COMMUNITY], limit: 1000 - communityAddrs.length}],
    })

    load({
      skipCache: true,
      forcePlatform: false,
      relays: hints.User().getUrls(),
      filters: getIdFilters(shuffle(communityAddrs).slice(0, 1000)),
    })

    return () => {
      loader.stop()
      scroller.stop()
    }
  })
</script>

<FlexColumn bind:element>
  <div class="flex justify-between">
    <div class="flex items-center gap-2">
      <i class="fa fa-circle-nodes fa-lg" />
      <h2 class="staatliches text-2xl">Your groups</h2>
    </div>
    <Anchor modal button accent href="/groups/new">
      <i class="fa-solid fa-plus" /> Create
    </Anchor>
  </div>
  {#each $userGroups as group (group.address)}
    <GroupListItem address={group.address} />
  {:else}
    <p class="text-center py-8">You haven't yet joined any groups.</p>
  {/each}
  <div class="mb-2 border-b border-solid border-neutral-600 pt-2" />
  <Input bind:value={q} type="text" class="flex-grow" placeholder="Search groups">
    <i slot="before" class="fa-solid fa-search" />
  </Input>
  {#each otherGroups as group (group.address)}
    <GroupListItem address={group.address} />
  {/each}
</FlexColumn>
