<script lang="ts">
  import {quantify} from "hurdak"
  import {onDestroy} from "svelte"
  import {ThreadLoader} from "src/engine"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/app/shared/Note.svelte"

  export let eid
  export let relays

  const loader = new ThreadLoader({anchorId: eid, relays})
  const {anchor, root, parent, ancestors} = loader

  let loading = true
  let showAncestors = false

  $: loading = loading && !($anchor && $root && $parent)

  onDestroy(() => {
    loader.stop()

    setTimeout(() => {
      loading = false
    }, 3000)
  })
</script>

{#if loading}
  <Spinner />
{:else}
  <Content gap="gap-4">
    {#if $root}
      <Note note={$root} />
    {/if}
    {#if showAncestors}
      {#each $ancestors as ancestor (ancestor.id)}
        <Note topLevel showParent={false} note={ancestor} />
      {/each}
    {:else if $ancestors.length > 0}
      <Anchor
        class="text-center text-gray-1"
        on:click={() => {
          showAncestors = true
        }}>
        <i class="fa fa-up-down pr-2 text-sm" />
        Show {quantify($ancestors.length, "other note")}
      </Anchor>
    {/if}
    {#if $parent}
      <Note topLevel showParent={false} note={$parent} />
    {/if}
    {#if $anchor}
      <Note topLevel showParent={false} note={$anchor} depth={2} />
    {/if}
  </Content>
{/if}
