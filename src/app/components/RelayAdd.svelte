<script lang="ts">
  import {onMount} from "svelte"
  import type {Readable} from "svelte/store"
  import {tryCatch} from "@welshman/lib"
  import {isShareableRelayUrl, normalizeRelayUrl} from "@welshman/util"
  import {relaySearch} from "@welshman/app"
  import {createScroller} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import RelayItem from "@app/components/RelayItem.svelte"

  interface Props {
    relays: Readable<string[]>
    addRelay: (url: string) => void
  }

  const {relays, addRelay}: Props = $props()

  let term = $state("")
  let limit = $state(20)
  let element: Element | undefined = $state()

  const customUrl = $derived(tryCatch(() => normalizeRelayUrl(term)))

  onMount(() => {
    const scroller = createScroller({
      element: element!,
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
<div class="column -m-6 mt-0 h-[50vh] gap-2 overflow-auto p-6 pt-2" bind:this={element}>
  {#if customUrl && isShareableRelayUrl(customUrl) && !$relays.includes(normalizeRelayUrl(customUrl))}
    <RelayItem url={term}>
      <Button class="btn btn-outline btn-sm flex items-center" onclick={() => addRelay(customUrl)}>
        <Icon icon="add-circle" />
        Add Relay
      </Button>
    </RelayItem>
  {/if}
  {#each $relaySearch
    .searchValues(term)
    .filter(url => !$relays.includes(url))
    .slice(0, limit) as url (url)}
    <RelayItem {url}>
      <Button class="btn btn-outline btn-sm flex items-center" onclick={() => addRelay(url)}>
        <Icon icon="add-circle" />
        Add Relay
      </Button>
    </RelayItem>
  {/each}
</div>
