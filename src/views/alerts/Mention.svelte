<script lang="ts">
  import {ellipsize} from 'hurdak/lib/hurdak'
  import {formatTimestamp} from 'src/util/misc'
  import {displayPerson} from 'src/util/nostr'
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
    <div class="flex gap-2 items-center">
      <ImageCircle src={person.kind0?.picture} />
      <div on:click|stopPropagation>
        <Popover class="inline-block">
          <div slot="trigger" class="font-bold">
            {displayPerson(person)}
          </div>
          <div slot="tooltip">
            <PersonSummary pubkey={note.pubkey} />
          </div>
        </Popover>
        <div class="inline-block">mentioned you.</div>
      </div>
    </div>
    <p class="text-sm text-light">{formatTimestamp(note.created_at)}</p>
  </div>
  <div class="ml-6 text-light">
    {ellipsize(note.content, 120)}
  </div>
</button>
