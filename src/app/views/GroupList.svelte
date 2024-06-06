<script>
  import {onMount} from "svelte"
  import {filter, assoc} from "ramda"
  import {now} from "@welshman/lib"
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
    getGroupReqInfo,
    loadGiftWraps,
    loadGroupMessages,
    deriveIsGroupMember,
    updateCurrentSession,
    forcePlatformRelays,
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
    const {admins} = getGroupReqInfo()
    const scroller = createScroller(loadMore, {element})

    updateCurrentSession(assoc("groups_last_synced", now()))

    const loaders = [loadGiftWraps(), loadGroupMessages()]

    load({
      skipCache: true,
      relays: forcePlatformRelays(hints.User().getUrls()),
      filters: [
        {kinds: [35834, 34550], authors: admins},
        {kinds: [35834, 34550], limit: 500},
      ],
    })

    return () => {
      scroller.stop()
      loaders.forEach(loader => loader.stop())
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
