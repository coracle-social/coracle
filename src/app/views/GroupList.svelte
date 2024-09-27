<script>
  import {onMount} from "svelte"
  import {filter, reject, assoc} from "ramda"
  import {derived} from "svelte/store"
  import {ctx, now, shuffle} from "@welshman/lib"
  import {GROUP, COMMUNITY, COMMUNITIES, getAddress, getIdFilters} from "@welshman/util"
  import {pubkey, updateSession} from "@welshman/app"
  import {createScroller} from "src/util/misc"
  import Anchor from "src/partials/Anchor.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Input from "src/partials/Input.svelte"
  import GroupListItem from "src/app/shared/GroupListItem.svelte"
  import {
    load,
    groups,
    loadGroupMessages,
    userIsGroupMember,
    communityListsByAddress,
    groupMetaSearch,
    groupMeta,
    userFollows,
    addSinceToFilter,
  } from "src/engine"

  const loadMore = async () => {
    limit += 20
  }

  const userIsMember = meta => $userIsGroupMember(getAddress(meta.event), true)

  const userGroupMeta = derived(groupMeta, filter(userIsMember))

  let q = ""
  let limit = 20
  let element = null

  $: otherGroupMeta = reject(userIsMember, $groupMetaSearch.searchOptions(q)).slice(0, limit)

  document.title = "Groups"

  onMount(() => {
    const scroller = createScroller(loadMore, {element})
    const communityAddrs = Array.from($communityListsByAddress.keys()).filter(
      a => !groups.key(a).get()?.meta,
    )

    if ($pubkey) {
      updateSession($pubkey, assoc("groups_last_synced", now()))

      loadGroupMessages()

      load({
        skipCache: true,
        forcePlatform: false,
        filters: [
          addSinceToFilter({kinds: [COMMUNITIES], authors: [$pubkey, ...Array.from($userFollows)]}),
        ],
      })
    }

    load({
      skipCache: true,
      relays: ctx.app.router.User().getUrls(),
      filters: [{kinds: [GROUP, COMMUNITY], limit: 1000 - communityAddrs.length}],
    })

    load({
      skipCache: true,
      forcePlatform: false,
      relays: ctx.app.router.User().getUrls(),
      filters: getIdFilters(shuffle(communityAddrs).slice(0, 1000)),
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
  {#each $userGroupMeta as meta (meta.event.id)}
    <GroupListItem address={getAddress(meta.event)} />
  {:else}
    <p class="text-center py-8">You haven't yet joined any groups.</p>
  {/each}
  <div class="mb-2 border-b border-solid border-neutral-600 pt-2" />
  <Input bind:value={q} type="text" class="flex-grow" placeholder="Search groups">
    <i slot="before" class="fa-solid fa-search" />
  </Input>
  {#each otherGroupMeta as meta (meta.event.id)}
    <GroupListItem address={getAddress(meta.event)} />
  {/each}
</FlexColumn>
