<script>
  import {onMount} from 'svelte'
  import {nip19} from 'nostr-tools'
  import {fly} from 'svelte/transition'
  import {first} from 'hurdak/lib/hurdak'
  import {log} from 'src/util/logger'
  import {getAllEventRelays} from 'src/agent/helpers'
  import network from 'src/agent/network'
  import Note from 'src/partials/Note.svelte'
  import Content from 'src/partials/Content.svelte'
  import Spinner from 'src/partials/Spinner.svelte'
  import {asDisplayEvent} from 'src/app'

  export let note
  export let relays = []

  let loading = true

  onMount(async () => {
    relays = relays.concat(getAllEventRelays(note))

    if (!note.pubkey) {
      note = first(await network.load(relays, {ids: [note.id]}))
    }

    if (note) {
      log('NoteDetail', nip19.noteEncode(note.id), note)

      network.streamContext({
        relays,
        depth: 10,
        notes: [note],
        updateNotes: cb => {
          note = first(cb([note]))
        },
      })
    }

    loading = false
  })
</script>

{#if !note}
<div in:fly={{y: 20}}>
  <Content size="lg" class="text-center">
    Sorry, we weren't able to find this note.
  </Content>
</div>
{:else if note.pubkey}
<div in:fly={{y: 20}}>
  <Note invertColors anchorId={note.id} note={asDisplayEvent(note)} />
</div>
{/if}

{#if loading}
<Spinner />
{/if}
