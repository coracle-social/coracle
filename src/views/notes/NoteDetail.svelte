<script>
  import {onMount} from "svelte"
  import {pluck, propEq} from "ramda"
  import {fly} from "svelte/transition"
  import {first} from "hurdak/lib/hurdak"
  import {asDisplayEvent} from "src/util/nostr"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/views/notes/Note.svelte"
  import network from "src/agent/network"
  import {sampleRelays} from "src/agent/relays"

  export let note
  export let relays = []
  export let invertColors = false

  let found = false
  let loading = true
  let seen = new Set()

  onMount(() => {
    const sub = network.listen({
      relays: sampleRelays(relays),
      filter: [
        {kinds: [1], ids: [note.id]},
        {kinds: [1, 7, 9735], "#e": [note.id]},
      ],
      onChunk: chunk => {
        const children = chunk.filter(propEq("kind", 1))

        // Recursively bring in context for children, since reactions etc don't
        // contain the full chain of ancestors
        network.streamContext({
          depth: 5,
          notes: children.filter(e => !seen.has(e.id)),
          onChunk: childChunk => {
            note = first(network.applyContext([note], childChunk))
          },
        })

        // Keep track of the children we've seen, update latest version of our note
        children.forEach(event => {
          if (event.id === note.id) {
            found = true
            loading = false
            note = {...note, ...event}
          }

          seen.add(event.id)
        })

        // Load authors
        network.loadPeople(pluck("pubkey", children))

        // Apply context
        note = first(network.applyContext([note], chunk))
      },
    })

    setTimeout(() => {
      loading = false
    }, 3000)

    return () => sub.then(s => s.unsub())
  })
</script>

{#if !loading && !found}
  <div in:fly={{y: 20}}>
    <Content size="lg" class="text-center">Sorry, we weren't able to find this note.</Content>
  </div>
{:else if note.pubkey}
  <div in:fly={{y: 20}} class="m-auto flex w-full max-w-2xl flex-col gap-4 p-4">
    <Note showContext depth={6} anchorId={note.id} note={asDisplayEvent(note)} {invertColors} />
  </div>
{/if}

{#if loading}
  <Spinner />
{/if}
