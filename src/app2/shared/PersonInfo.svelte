<script lang="ts">
  import {last, nth} from "ramda"
  import {fly} from "svelte/transition"
  import {noEvent} from "src/util/html"
  import {displayPerson} from "src/util/nostr"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app2/shared/PersonCircle.svelte"
  import PersonAbout from "src/app2/shared/PersonAbout.svelte"
  import {getPubkeyWriteRelays, sampleRelays} from "src/agent/relays"
  import user from "src/agent/user"
  import {routes} from "src/app/ui"

  export let person

  export let hasPetname = pubkey => user.getPetnames().map(nth(1)).includes(pubkey)

  export let removePetname = ({pubkey}) => user.removePetname(pubkey)

  export let addPetname = ({pubkey}) => {
    const [{url}] = sampleRelays(getPubkeyWriteRelays(pubkey))

    user.addPetname(pubkey, url, displayPerson(person))
  }
</script>

<a
  in:fly={{y: 20}}
  href={routes.person(person.pubkey)}
  class="flex gap-4 overflow-hidden border-l-2 border-solid border-gray-7 py-3 px-4
         transition-all hover:border-accent hover:bg-gray-8">
  <PersonCircle {person} size={12} />
  <div class="flex min-w-0 flex-grow flex-col gap-4">
    <div class="flex items-start justify-between gap-2">
      <div class="flex flex-col gap-2">
        <h1 class="text-xl">{displayPerson(person)}</h1>
        {#if person.verified_as}
          <div class="flex gap-1 text-sm">
            <i class="fa fa-user-check text-accent" />
            <span class="text-gray-1">{last(person.verified_as.split("@"))}</span>
          </div>
        {/if}
      </div>
      {#if hasPetname(person.pubkey)}
        <Anchor type="button-accent" on:click={noEvent(() => removePetname(person))}>
          Following
        </Anchor>
      {:else}
        <Anchor type="button" on:click={noEvent(() => addPetname(person))}>Follow</Anchor>
      {/if}
    </div>
    <p class="overflow-hidden text-ellipsis">
      <PersonAbout truncate {person} />
    </p>
  </div>
</a>
