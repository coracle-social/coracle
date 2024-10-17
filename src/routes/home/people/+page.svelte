<script lang="ts">
  import {onMount} from "svelte"
  import {createScroller} from "@lib/html"
  import {uniq, shuffle} from "@welshman/lib"
  import {getPubkeyTagValues, getListTags} from "@welshman/util"
  import {profileSearch, userFollows} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import PageHeader from "@lib/components/PageHeader.svelte"
  import PeopleItem from "@app/components/PeopleItem.svelte"
  import {getDefaultPubkeys} from '@app/state'

  const defaultPubkeys = getDefaultPubkeys()

  let term = ""
  let limit = 10
  let element: Element

  $: pubkeys = term ? $profileSearch.searchValues(term) : defaultPubkeys

  onMount(() => {
    const scroller = createScroller({
      element,
      onScroll: () => {
        limit += 10
      },
    })

    return () => scroller.stop()
  })
</script>

<div class="content column gap-4" bind:this={element}>
  <PageHeader>
    <div slot="title">People</div>
    <div slot="info">Get the latest from people in your network</div>
  </PageHeader>
  <label class="input input-bordered flex w-full items-center gap-2">
    <Icon icon="magnifer" />
    <input bind:value={term} class="grow" type="text" placeholder="Search for people..." />
  </label>
  <div class="flex flex-col gap-2">
    {#each pubkeys.slice(0, limit) as pubkey (pubkey)}
      <PeopleItem {pubkey} />
    {/each}
  </div>
</div>
