<script lang="ts">
  import {onDestroy} from "svelte"
  import {quantify} from "hurdak"
  import {ThreadLoader} from "src/engine"
  import Anchor from "src/partials/Anchor.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import FeedItem from "src/app/shared/FeedItem.svelte"
  import {deriveEvent} from "src/engine"

  export let id = null
  export let address = null
  export let relays

  const event = deriveEvent(id || address)

  let loading = true
  let showAncestors = false
  let loader: ThreadLoader, root, parent, ancestors

  $: {
    if ($event && !loader) {
      loader = new ThreadLoader($event, relays)
      ;({root, parent, ancestors} = loader)
    }

    if ($event && $root && $parent) {
      loading = false
    }
  }

  onDestroy(() => loader?.stop())
</script>

{#if loading}
  <Spinner />
{:else}
  <FeedItem note={$root} />
  {#if showAncestors}
    {#each $ancestors as ancestor (ancestor.id)}
      <FeedItem topLevel showParent={false} note={ancestor} />
    {/each}
  {:else if $ancestors.length > 0}
    <Anchor
      class="text-center text-neutral-100"
      on:click={() => {
        showAncestors = true
      }}>
      <i class="fa fa-up-down pr-2 text-sm" />
      Show {quantify($ancestors.length, "other note")}
    </Anchor>
  {/if}
  <FeedItem topLevel showParent={false} note={$parent} />
  <FeedItem topLevel showParent={false} note={$event} depth={2} />
{/if}
