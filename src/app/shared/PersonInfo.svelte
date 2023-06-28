<script lang="ts">
  import {last, nth} from "ramda"
  import {fly} from "src/util/transition"
  import {displayPerson} from "src/util/nostr"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import {keys} from "src/system"
  import {getPubkeyWriteRelays, sampleRelays} from "src/agent/relays"
  import user from "src/agent/user"

  const {canSign} = keys
  const {petnames} = user

  export let person
  export let hasPetname = null

  const removePetname = ({pubkey}) => user.removePetname(pubkey)

  const addPetname = ({pubkey}) => {
    const [{url}] = sampleRelays(getPubkeyWriteRelays(pubkey))

    user.addPetname(pubkey, url, displayPerson(person))
  }

  $: isFollowing = hasPetname
    ? hasPetname(person.pubkey)
    : $petnames.map(nth(1)).includes(person.pubkey)
</script>

<div in:fly={{y: 20}}>
  <Anchor
    type="unstyled"
    on:click={() => modal.push({type: "person/feed", pubkey: person.pubkey})}
    class="flex gap-4 overflow-hidden border-l-2 border-solid border-gray-7 py-3 pl-4
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
        {#if $canSign}
          {#if isFollowing}
            <Anchor theme="button-accent" stopPropagation on:click={() => removePetname(person)}>
              Following
            </Anchor>
          {:else}
            <Anchor theme="button" stopPropagation on:click={() => addPetname(person)}
              >Follow</Anchor>
          {/if}
        {/if}
      </div>
      <p class="overflow-hidden text-ellipsis">
        <PersonAbout truncate {person} />
      </p>
    </div>
  </Anchor>
</div>
