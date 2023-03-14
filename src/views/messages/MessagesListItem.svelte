<script>
  import {nip19} from "nostr-tools"
  import {navigate} from "svelte-routing"
  import {fly} from "svelte/transition"
  import {ellipsize} from "hurdak/lib/hurdak"
  import {displayPerson} from "src/util/nostr"
  import {getPersonWithFallback} from "src/agent/tables"
  import {lastChecked} from "src/app/alerts"
  import PersonCircle from "src/partials/PersonCircle.svelte"

  export let contact

  const newMessages = contact.lastMessage > $lastChecked[contact.pubkey]
  const person = getPersonWithFallback(contact.pubkey)
  const enter = () => navigate(`/messages/${nip19.npubEncode(contact.pubkey)}`)
</script>

<button
  class="flex cursor-pointer gap-4 rounded border border-solid border-medium bg-dark
         px-4 py-6 transition-all hover:bg-medium"
  on:click={enter}
  in:fly={{y: 20}}>
  <PersonCircle size={14} {person} />
  <div class="flex min-w-0 flex-grow flex-col justify-start gap-2">
    <div class="flex flex-grow items-start justify-between gap-2">
      <div class="flex items-center gap-2 overflow-hidden">
        <i class="fa fa-lock text-light" />
        <h2 class="text-lg">{displayPerson(person)}</h2>
      </div>
      <div class="relative">
        <i class="fa fa-bell" class:text-light={!newMessages} />
        {#if newMessages}
          <div class="absolute top-0 right-0 mt-1 h-1 w-1 rounded-full bg-accent" />
        {/if}
      </div>
    </div>
    {#if person.kind0?.about}
      <p class="text-start text-light">
        {ellipsize(person.kind0.about, 300)}
      </p>
    {/if}
  </div>
</button>
