<script lang="ts">
  import {quantify} from "hurdak"
  import {onDestroy} from "svelte"
  import {ThreadLoader} from "src/engine"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/app/shared/Note.svelte"

  export let anchorId
  export let relays

  const loader = new ThreadLoader({anchorId, relays})
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
      <Note invertColors note={$root} />
    {/if}
    {#if showAncestors}
      {#each $ancestors as ancestor (ancestor.id)}
        <Note invertColors topLevel showParent={false} note={ancestor} />
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
      <Note invertColors topLevel showParent={false} note={$parent} />
    {/if}
    {#if $anchor}
      <Note invertColors showContext topLevel showParent={false} note={$anchor} depth={2} />
    {/if}
  </Content>
{/if}
