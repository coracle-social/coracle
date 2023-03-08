<script>
  import {onMount} from "svelte"
  import {nip19} from "nostr-tools"
  import {fly} from "svelte/transition"
  import {first} from "hurdak/lib/hurdak"
  import {log} from "src/util/logger"
  import {asDisplayEvent} from "src/util/nostr"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Note from "src/views/notes/Note.svelte"
  import user from "src/agent/user"
  import network from "src/agent/network"
  import {sampleRelays} from "src/agent/relays"

  export let note
  export let relays = []
  export let invertColors = false

  let found = false
  let loading = true

  onMount(async () => {
    if (note.pubkey) {
      found = true
    } else {
      await network.load({
        relays: sampleRelays(relays),
        filter: {kinds: [1], ids: [note.id]},
        onChunk: events => {
          found = true
          note = first(events)
        },
      })
    }

    if (note) {
      log("NoteDetail", nip19.noteEncode(note.id), note)

      network.streamContext({
        depth: 6,
        notes: [note],
        onChunk: context => {
          note = first(network.applyContext([note], user.muffle(context)))
        },
      })
    }

    loading = false
  })
</script>

{#if !loading && !found}
  <div in:fly={{y: 20}}>
    <Content size="lg" class="text-center">Sorry, we weren't able to find this note.</Content>
  </div>
{:else if note.pubkey}
  <div in:fly={{y: 20}} class="m-auto flex max-w-2xl flex-col gap-4 p-4">
    <Note showContext depth={6} anchorId={note.id} note={asDisplayEvent(note)} {invertColors} />
  </div>
{/if}

{#if loading}
  <Spinner />
{/if}
