<script lang="ts">
  import {onMount} from "svelte"
  import {createScroller} from "@lib/html"
  import {profileSearch} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import PeopleItem from "@app/components/PeopleItem.svelte"
  import {getDefaultPubkeys} from "@app/state"

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

<div class="m-auto w-full max-w-3xl column content-t" bind:this={element}>
  <div class="content-x flex-grow">
    <label class="input input-bordered flex w-full items-center gap-2">
      <Icon icon="magnifer" />
      <input bind:value={term} class="grow" type="text" placeholder="Search for people..." />
    </label>
  </div>
  <div class="content-b content-x flex flex-col gap-2 overflow-auto pt-2">
    {#each pubkeys.slice(0, limit) as pubkey (pubkey)}
      <PeopleItem {pubkey} />
    {/each}
  </div>
</div>
