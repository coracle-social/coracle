<script lang="ts">
  import {onMount} from "svelte"
  import {createScroller, isMobile} from "@lib/html"
  import {profileSearch} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Page from "@lib/components/Page.svelte"
  import ContentSearch from "@lib/components/ContentSearch.svelte"
  import PeopleItem from "@app/components/PeopleItem.svelte"
  import {getDefaultPubkeys} from "@app/state"

  const defaultPubkeys = getDefaultPubkeys()

  let term = $state("")
  let limit = $state(10)
  let element: Element | undefined = $state()

  const pubkeys = $derived(term ? $profileSearch.searchValues(term) : defaultPubkeys)

  onMount(() => {
    const scroller = createScroller({
      element: element!,
      onScroll: () => {
        limit += 10
      },
    })

    return () => scroller.stop()
  })
</script>

<Page>
  <ContentSearch>
    {#snippet input()}
      <label class="row-2 input input-bordered">
        <Icon icon="magnifer" />
        <!-- svelte-ignore a11y_autofocus -->
        <input
          autofocus={!isMobile}
          bind:value={term}
          class="grow"
          type="text"
          placeholder="Search for people..." />
      </label>
    {/snippet}
    {#snippet content()}
      <div class="col-2" bind:this={element}>
        {#each pubkeys.slice(0, limit) as pubkey (pubkey)}
          <PeopleItem {pubkey} />
        {/each}
      </div>
    {/snippet}
  </ContentSearch>
</Page>
