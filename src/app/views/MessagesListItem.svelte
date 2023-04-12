<script>
  import {nip19} from "nostr-tools"
  import {navigate} from "svelte-routing"
  import {ellipsize} from "hurdak/lib/hurdak"
  import {displayPerson} from "src/util/nostr"
  import {getPersonWithFallback} from "src/agent/db"
  import {lastChecked} from "src/app/state"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import Card from "src/partials/Card.svelte"

  export let contact

  const newMessages = contact.lastMessage > $lastChecked[contact.pubkey]
  const person = getPersonWithFallback(contact.pubkey)
  const enter = () => navigate(`/messages/${nip19.npubEncode(contact.pubkey)}`)
</script>

<Card interactive on:click={enter}>
  <div class="flex gap-4 px-4 py-6">
    <PersonCircle size={14} {person} />
    <div class="flex min-w-0 flex-grow flex-col justify-start gap-2">
      <div class="flex flex-grow items-start justify-between gap-2">
        <div class="flex items-center gap-2 overflow-hidden">
          <i class="fa fa-lock text-gray-1" />
          <h2 class="text-lg">{displayPerson(person)}</h2>
        </div>
        <div class="relative">
          <i class="fa fa-bell" class:text-gray-5={!newMessages} />
          {#if newMessages}
            <div class="absolute top-0 right-0 mt-1 h-1 w-1 rounded-full bg-accent" />
          {/if}
        </div>
      </div>
      {#if person.kind0?.about}
        <p class="text-start text-gray-1">
          {ellipsize(person.kind0.about, 300)}
        </p>
      {/if}
    </div>
  </div>
</Card>
