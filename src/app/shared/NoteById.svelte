<script lang="ts">
  import {first} from "hurdak"
  import {onMount, onDestroy} from "svelte"
  import {fly} from "src/util/transition"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/app/shared/Note.svelte"
  import {load, ContextLoader, selectHints, getSetting} from "src/engine2"

  export let id
  export let relays = []
  export let invertColors = false

  const context = new ContextLoader({
    filters: [{ids: [id]}],
    onEvent: e => {
      // Update feed, but only if we have loaded an actual note
      if (note) {
        note = first(context.applyContext([note]))
      }
    },
  })

  let note
  let loading = true

  onMount(async () => {
    await load({
      filters: [{ids: [id]}],
      relays: selectHints(getSetting("relay_limit"), relays),
      onEvent: e => {
        context.addContext([e], {depth: 0})

        note = first(context.applyContext([e]))
      },
    })

    loading = false
  })

  onDestroy(() => {
    context.stop()
  })
</script>

{#if loading}
  <Spinner />
{:else if !loading && !note}
  <div in:fly={{y: 20}}>
    <Content size="lg" class="text-center">Sorry, we weren't able to find this note.</Content>
  </div>
{:else if note}
  <div in:fly={{y: 20}}>
    <Note {invertColors} {note} />
  </div>
{/if}
