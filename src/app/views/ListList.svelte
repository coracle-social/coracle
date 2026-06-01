<script lang="ts">
  import {getAddress} from "@welshman/util"
  import {pubkey} from "@welshman/app"
  import {Router} from "@welshman/router"
  import {onMount} from "svelte"
  import {createScroller} from "src/util/misc"
  import {fly} from "src/util/transition"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Link from "src/partials/Link.svelte"
  import Button from "src/partials/Button.svelte"
  import Input from "src/partials/Input.svelte"
  import Card from "src/partials/Card.svelte"
  import ListListItem from "src/app/shared/ListListItem.svelte"
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
    relays: Router.get().FromPubkeys(authors).getUrls(),
    filters: [addSinceToFilter({kinds: EDITABLE_LIST_KINDS, authors})],
  })

  $: otherLists = $listSearch
    .searchValues(q)
    .filter(address => !address.includes($pubkey))
    .slice(0, limit)

  onMount(() => {
    const scroller = createScroller(loadMore, {element})

    return () => scroller.stop()
  })
</script>

<FlexColumn bind:element>
  <div class="flex items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      <i class="fa fa-list fa-lg text-accent" />
      <h2 class="staatliches text-2xl">Your lists</h2>
    </div>
    <Button class="btn btn-accent" on:click={createList}>
      <i class="fa fa-plus" /> List
    </Button>
  </div>
  {#each $userLists as list (getAddress(list.event))}
    {@const address = getAddress(list.event)}
    <div in:fly={{y: 20}}>
      <ListListItem {address}>
        <Link
          slot="controls"
          modal
          href={router.at("lists").of(address).at("edit").toString()}
          class="btn">
          <i class="fa fa-edit" /> Edit
        </Link>
      </ListListItem>
    </div>
  {/each}
  {#if $userLists.length === 0}
    <Card>
      <div class="flex flex-col items-center gap-2 py-8 text-center text-neutral-400">
        <i class="fa fa-list fa-2x" />
        <p>You don't have any lists yet.</p>
        <Button class="btn btn-low mt-2" on:click={createList}>
          <i class="fa fa-plus" /> Create a list
        </Button>
      </div>
    </Card>
  {/if}
  <div class="mt-4 flex flex-col gap-1">
    <div class="flex items-center gap-3">
      <i class="fa fa-circle-nodes fa-lg text-accent" />
      <h2 class="staatliches text-2xl">Other lists</h2>
    </div>
    <p class="text-sm text-neutral-400">Lists created by people in your network.</p>
  </div>
  <Input bind:value={q} placeholder="Search lists">
    <i slot="before" class="fa-solid fa-search" />
  </Input>
  {#each otherLists as address (address)}
    <div in:fly={{y: 20}}>
      <ListListItem {address} />
    </div>
  {/each}
  {#if q && otherLists.length === 0}
    <p class="py-8 text-center text-neutral-400">No lists matching "{q}".</p>
  {/if}
</FlexColumn>
