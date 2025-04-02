<script lang="ts">
  import {getAddress} from "@welshman/util"
  import {pubkey, Router} from "@welshman/app"
  import {onMount} from "svelte"
  import {createScroller} from "src/util/misc"
  import {fly} from "src/util/transition"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Input from "src/partials/Input.svelte"
  import ListCard from "src/app/shared/ListCard.svelte"
  import {router} from "src/app/util/router"
  import {EDITABLE_LIST_KINDS} from "src/domain"
  import {userLists, userFollows, listSearch, myLoad, addSinceToFilter} from "src/engine"

  const createList = () => router.at("lists/create").open()

  const loadMore = async () => {
    limit += 20
  }

  let q = ""
  let limit = 20
  let element

  const authors = Array.from($userFollows)

  myLoad({
    skipCache: true,
    forcePlatform: false,
    relays: Router.get().FromPubkeys(authors).getUrls(),
    filters: [addSinceToFilter({kinds: EDITABLE_LIST_KINDS, authors})],
  })

  onMount(() => {
    const scroller = createScroller(loadMore, {element})

    return () => scroller.stop()
  })
</script>

<FlexColumn bind:element>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-2">
      <i class="fa fa-list fa-lg" />
      <h2 class="staatliches text-2xl">Your lists</h2>
    </div>
    <Anchor button accent on:click={createList}>
      <i class="fa fa-plus" /> List
    </Anchor>
  </div>
  {#each $userLists as list (getAddress(list.event))}
    {@const address = getAddress(list.event)}
    <div in:fly={{y: 20}}>
      <ListCard {address}>
        <div slot="controls">
          <Anchor modal href={router.at("lists").of(address).at("edit").toString()}>
            <i class="fa fa-edit" /> Edit
          </Anchor>
        </div>
      </ListCard>
    </div>
  {/each}
  {#if $userLists.length === 0}
    <p class="py-12 text-center">You don't have any lists yet.</p>
  {/if}
  <div class="flex items-center gap-2">
    <i class="fa fa-circle-nodes fa-lg" />
    <h2 class="staatliches text-2xl">Other lists</h2>
  </div>
  <p>Below are lists created by people in your network.</p>
  <Input bind:value={q} placeholder="Search lists">
    <i slot="before" class="fa-solid fa-search" />
  </Input>
  {#each $listSearch
    .searchValues(q)
    .filter(address => !address.includes($pubkey))
    .slice(0, limit) as address (address)}
    <ListCard {address} />
  {/each}
</FlexColumn>
