<script>
  import {onMount} from 'svelte'
  import {nip19} from 'nostr-tools'
  import {fly} from 'svelte/transition'
  import {load} from 'src/agent'
  import {annotate} from 'src/app'
  import loaders from 'src/app/loaders'
  import Note from 'src/partials/Note.svelte'
  import Content from 'src/partials/Content.svelte'
  import Spinner from 'src/partials/Spinner.svelte'

  export let note
  export let relays

  let loading = true

  onMount(async () => {
    const [found] = await load(relays, {ids: [note.id]})

    if (found) {
      // Show the main note without waiting for context
      if (!note.pubkey) {
        note = annotate(found, [])
      }

      const context = await loaders.loadContext(relays, found, {
        depth: 3,
        loadParents: true,
      })

      note = annotate(found, context)

      console.log('NoteDetail', nip19.noteEncode(note.id), note)
    } else if (!note.pubkey) {
      note = null
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
  <Note invertColors anchorId={note.id} note={note} depth={2} />
</div>
{/if}

{#if loading}
<Spinner />
{/if}
