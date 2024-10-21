<script lang="ts">
  import {onMount} from "svelte"
  import {createScroller} from "@lib/html"
  import {profileSearch} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Page from "@lib/components/Page.svelte"
  import ContentSearch from "@lib/components/ContentSearch.svelte"
  import PeopleItem from "@app/components/PeopleItem.svelte"
  import {getDefaultPubkeys} from "@app/state"

  const defaultPubkeys = getDefaultPubkeys()

  let term = ""
  let limit = 10
  let element: Element

  $: pubkeys = term ? $profileSearch.searchValues(term) : defaultPubkeys

  onMount(() => {
    console.log(element)
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
  <ContentSearch>
    <label slot="input" class="input input-bordered row-2">
      <Icon icon="magnifer" />
      <!-- svelte-ignore a11y-autofocus -->
      <input autofocus bind:value={term} class="grow" type="text" placeholder="Search for people..." />
    </label>
    <div slot="content" class="col-2" bind:this={element}>
      {#each pubkeys.slice(0, limit) as pubkey (pubkey)}
        <PeopleItem {pubkey} />
      {/each}
    </div>
  </ContentSearch>
</Page>
