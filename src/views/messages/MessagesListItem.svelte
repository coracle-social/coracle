<script>
  import {nip19} from 'nostr-tools'
  import {navigate} from 'svelte-routing'
  import {fly} from 'svelte/transition'
  import {ellipsize} from 'hurdak/lib/hurdak'
  import {displayPerson} from 'src/util/nostr'
  import database from 'src/agent/database'
  import {lastChecked} from 'src/app/alerts'

  export let contact

  const newMessages = contact.lastMessage > $lastChecked[contact.pubkey]
  const person = database.getPersonWithFallback(contact.pubkey)
  const enter = () => navigate(`/messages/${nip19.npubEncode(contact.pubkey)}`)
</script>

<button
  class="flex gap-4 px-4 py-6 cursor-pointer hover:bg-medium transition-all rounded
         border border-solid border-medium bg-dark"
  on:click={enter}
  in:fly={{y: 20}}>
  <div
    class="overflow-hidden w-14 h-14 rounded-full bg-cover bg-center shrink-0 border
           border-solid border-white"
    style="background-image: url({person.kind0?.picture})" />
  <div class="flex flex-grow flex-col justify-start gap-2 min-w-0">
    <div class="flex flex-grow items-start justify-between gap-2">
      <div class="flex gap-2 items-center overflow-hidden">
        <i class="fa fa-lock text-light" />
        <h2 class="text-lg">{displayPerson(person)}</h2>
      </div>
      <div class="relative">
        <i class="fa fa-bell" class:text-light={!newMessages} />
        {#if newMessages}
        <div class="w-1 h-1 rounded-full bg-accent top-0 right-0 absolute mt-1" />
        {/if}
      </div>
    </div>
    {#if person.kind0?.about}
    <p class="text-light text-start">
      {ellipsize(person.kind0.about, 300)}
    </p>
    {/if}
  </div>
</button>
