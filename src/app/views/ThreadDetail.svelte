<script lang="ts">
  import {onMount} from "svelte"
  import {quantify, defer} from "hurdak"
  import {fly} from "src/util/transition"
  import {ThreadLoader} from "src/engine"
  import Anchor from "src/partials/Anchor.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/app/shared/Note.svelte"
  import {dereferenceNote} from "src/engine"

  export let relays

  let loading = true
  let promise: Promise<void> = defer()
  let showAncestors = false
  let loader: ThreadLoader, anchor, root, parent, ancestors

  $: {
    if (anchor && $root && $parent) {
      loading = false
    }
  }

  onMount(() => {
    promise = dereferenceNote($$props).then(note => {
      anchor = note
      loader = new ThreadLoader(note, relays)
      ;({root, parent, ancestors} = loader)
    })

    return () => {
      promise.then(() => loader.stop())
    }
  })
</script>

{#if loading}
  <Spinner />
{:else}
  <Note note={$root} />
  {#if showAncestors}
    {#each $ancestors as ancestor (ancestor.id)}
      <div in:fly={{y: 20}}>
        <Note topLevel showParent={false} note={ancestor} />
      </div>
    {/each}
  {:else if $ancestors.length > 0}
    <Anchor
      class="text-center text-lightest"
      on:click={() => {
        showAncestors = true
      }}>
      <i class="fa fa-up-down pr-2 text-sm" />
      Show {quantify($ancestors.length, "other note")}
    </Anchor>
  {/if}
  <Note topLevel showParent={false} note={$parent} />
  <Note topLevel showParent={false} note={anchor} depth={2} />
{/if}
