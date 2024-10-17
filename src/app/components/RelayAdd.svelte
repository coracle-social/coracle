<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {relaySearch} from "@welshman/app"
  import {createScroller} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import RelayItem from "@app/components/RelayItem.svelte"

  export let relays: Readable<string[]>
  export let addRelay: (url: string) => void

  let term = ""
  let limit = 20
  let element: Element

  onMount(() => {
    const scroller = createScroller({
      element,
      delay: 300,
      onScroll: () => {
        limit += 20
      },
    })

    return () => {
      scroller.stop()
    }
  })
</script>

<label class="input input-bordered flex w-full items-center gap-2">
  <Icon icon="magnifer" />
  <input bind:value={term} class="grow" type="text" placeholder="Search for relays..." />
</label>
<div class="column -m-6 mt-0 p-6 pt-2 h-[50vh] gap-2 overflow-auto" bind:this={element}>
  {#each $relaySearch
    .searchValues(term)
    .filter(url => !$relays.includes(url))
    .slice(0, limit) as url (url)}
    <RelayItem {url}>
      <Button class="btn btn-outline btn-sm flex items-center" on:click={() => addRelay(url)}>
        <Icon icon="add-circle" />
        Add Relay
      </Button>
    </RelayItem>
  {/each}
</div>
