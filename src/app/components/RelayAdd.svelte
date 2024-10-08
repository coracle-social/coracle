<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {relaySearch} from "@welshman/app"
  import {createScroller} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import RelayItem from "@app/components/RelayItem.svelte"
  import {discoverRelays} from "@app/state"

  export let relays: Readable<string[]>
  export let addRelay: (url: string) => void

  let term = ""
  let limit = 20
  let element: Element

  onMount(() => {
    const sub = discoverRelays()
    const scroller = createScroller({
      delay: 300,
      element: element.closest(".modal-box")!,
      onScroll: () => {
        limit += 20
      },
    })

    return () => {
      sub.close()
      scroller.stop()
    }
  })
</script>

<div class="column gap-2" bind:this={element}>
  <label class="input input-bordered flex w-full items-center gap-2">
    <Icon icon="magnifer" />
    <input bind:value={term} class="grow" type="text" placeholder="Search for relays..." />
  </label>
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
