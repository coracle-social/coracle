<script lang="ts">
  import {ellipsize} from "hurdak/lib/hurdak"
  import {formatTimestamp} from "src/util/misc"
  import {displayPerson} from "src/util/nostr"
  import Popover from "src/partials/Popover.svelte"
  import PersonSummary from "src/views/person/PersonSummary.svelte"
  import database from "src/agent/database"
  import {modal} from "src/app/ui"
  import PersonCircle from "src/partials/PersonCircle.svelte";

  export let note

  const person = database.getPersonWithFallback(note.pubkey)
</script>

<button
  class="flex w-full cursor-pointer flex-col gap-2 border border-solid border-black py-2
         px-3 text-left text-white transition-all hover:border-medium hover:bg-dark"
  on:click={() => modal.set({type: "note/detail", note})}>
  <div class="relative flex w-full items-center justify-between gap-2">
    <div class="flex items-center gap-2">
      <PersonCircle src={person.kind0?.picture} />
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
