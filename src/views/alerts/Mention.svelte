<script lang="ts">
  import {ellipsize} from 'hurdak/lib/hurdak'
  import {formatTimestamp} from 'src/util/misc'
  import {displayPerson} from 'src/util/nostr'
  import Anchor from 'src/partials/Anchor.svelte'
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import Popover from "src/partials/Popover.svelte"
  import PersonSummary from "src/views/person/PersonSummary.svelte"
  import database from 'src/agent/database'
  import {modal} from 'src/app/ui'

  export let note

  const person = database.getPersonWithFallback(note.pubkey)
</script>

<button
  class="py-2 px-3 flex flex-col gap-2 text-white cursor-pointer transition-all w-full
         border border-solid border-black hover:border-medium hover:bg-dark text-left"
  on:click={() => modal.set({type: 'note/detail', note})}>
  <div class="flex gap-2 items-center justify-between relative w-full">
    <div class="flex gap-1 items-center" on:click|stopPropagation>
      <Popover>
        <div slot="trigger">
          <Anchor type="unstyled" class="text-lg font-bold flex gap-2 items-center">
            <ImageCircle src={person.kind0?.picture} />
            <span class="text-lg font-bold ml-1">{displayPerson(person)}</span>
          </Anchor>
        </div>
        <div slot="tooltip">
          <PersonSummary pubkey={note.pubkey} />
        </div>
      </Popover>
      <span>mentioned you.</span>
    </div>
    <p class="text-sm text-light">{formatTimestamp(note.created_at)}</p>
  </div>
  <div class="ml-6 text-light">
    {ellipsize(note.content, 120)}
  </div>
</button>
