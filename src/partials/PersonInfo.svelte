<script lang="ts">
  import {last} from "ramda"
  import {fly} from "svelte/transition"
  import {noEvent} from "src/util/html"
  import {displayPerson} from "src/util/nostr"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/partials/PersonCircle.svelte"
  import PersonAbout from "src/partials/PersonAbout.svelte"
  import {routes} from "src/app/ui"

  export let person
  export let addPetname = null
  export let removePetname = null
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
      {#if removePetname}
        <Anchor type="button-accent" on:click={noEvent(() => removePetname(person))}>
          Following
        </Anchor>
      {/if}
      {#if addPetname}
        <Anchor type="button" on:click={noEvent(() => addPetname(person))}>Follow</Anchor>
      {/if}
    </div>
    <p class="overflow-hidden text-ellipsis">
      <PersonAbout truncate {person} />
    </p>
  </div>
</a>
