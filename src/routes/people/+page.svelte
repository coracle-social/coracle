<script lang="ts">
  import {onMount} from "svelte"
  import {createScroller} from "@lib/html"
  import {profileSearch} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Page from "@lib/components/Page.svelte"
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

<Page>
  <div class="content col-2" bind:this={element}>
    <label class="input input-bordered flex w-full items-center gap-2">
      <Icon icon="magnifer" />
      <!-- svelte-ignore a11y-autofocus -->
      <input autofocus bind:value={term} class="grow" type="text" placeholder="Search for people..." />
    </label>
    {#each pubkeys.slice(0, limit) as pubkey (pubkey)}
      <PeopleItem {pubkey} />
    {/each}
  </div>
</Page>
