<script lang="ts">
  import {last} from 'ramda'
  import {fly} from 'svelte/transition'
  import {ellipsize} from 'hurdak/lib/hurdak'
  import {renderContent, noEvent} from "src/util/html"
  import {displayPerson} from "src/util/nostr"
  import Anchor from 'src/partials/Anchor.svelte'
  import {getPubkeyWriteRelays} from 'src/agent/relays'
  import user from 'src/agent/user'
  import {routes} from "src/app/ui"

  export let person

  const {petnamePubkeys} = user

  const addPetname = pubkey => {
    const [{url}] = getPubkeyWriteRelays(pubkey)

    user.addPetname(pubkey, url, displayPerson(person))
  }
</script>

<a
  in:fly={{y: 20}}
  href={routes.person(person.pubkey)}
  class="flex gap-4 border-l-2 border-solid border-dark hover:bg-black hover:border-accent transition-all py-3 px-6 overflow-hidden">
  <div
    class="overflow-hidden w-12 h-12 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
    style="background-image: url({person.kind0?.picture})" />
  <div class="flex-grow flex flex-col gap-4 min-w-0">
    <div class="flex gap-2 items-start justify-between">
      <div class="flex flex-col gap-2">
        <h1 class="text-xl">{displayPerson(person)}</h1>
        {#if person.verified_as}
        <div class="flex gap-1 text-sm">
          <i class="fa fa-user-check text-accent" />
          <span class="text-light">{last(person.verified_as.split('@'))}</span>
        </div>
        {/if}
      </div>
      {#if $petnamePubkeys.includes(person.pubkey)}
      <Anchor type="button-accent" on:click={noEvent(() => user.removePetname(person.pubkey))}>
        Following
      </Anchor>
      {:else}
      <Anchor type="button" on:click={noEvent(() => addPetname(person.pubkey))}>
        Follow
      </Anchor>
      {/if}
    </div>
    <p class="overflow-hidden text-ellipsis">
      {@html renderContent(ellipsize(person.kind0?.about || '', 140))}
    </p>
  </div>
</a>
