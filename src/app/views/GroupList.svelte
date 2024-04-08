<script>
  import {onMount} from "svelte"
  import {filter, assoc} from "ramda"
  import {now} from "@coracle.social/lib"
  import {createScroller} from "src/util/misc"
  import {giftWrapKinds} from "src/util/nostr"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Input from "src/partials/Input.svelte"
  import GroupListItem from "src/app/shared/GroupListItem.svelte"
  import {
    load,
    hints,
    groups,
    deletes,
    getGroupReqInfo,
    deriveIsGroupMember,
    updateCurrentSession,
    forcePlatformRelays,
    searchGroups,
  } from "src/engine"

  const loadMore = async () => {
    limit += 20
  }

  const userIsMember = g => deriveIsGroupMember(g.address, true).get()

  const userGroups = groups.derived(filter(g => !$deletes.has(g.address) && userIsMember(g)))

  let q = ""
  let limit = 20
  let element = null

  $: otherGroups = $searchGroups(q)
    .filter(g => !userIsMember(g))
    .slice(0, limit)

  document.title = "Groups"

  onMount(() => {
    const {admins, recipients, relays, since} = getGroupReqInfo()
    const scroller = createScroller(loadMore, {element})

    updateCurrentSession(assoc("groups_last_synced", now()))

    load({
      relays,
      filters: [{kinds: giftWrapKinds, "#p": recipients, since}],
    })

    load({
      relays: forcePlatformRelays(hints.User().getUrls()),
      filters: [
        {kinds: [35834, 34550], authors: admins},
        {kinds: [35834, 34550], limit: 500},
      ],
    })

    return () => scroller.stop()
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
  <Input bind:value={q} type="text" wrapperClass="flex-grow" placeholder="Search groups">
    <i slot="before" class="fa-solid fa-search" />
  </Input>
  {#each otherGroups as group (group.address)}
    <GroupListItem address={group.address} />
  {/each}
</FlexColumn>
