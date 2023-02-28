<script lang="ts">
  import {last} from 'ramda'
  import {navigate} from 'svelte-routing'
  import {renderContent} from 'src/util/html'
  import {displayPerson} from 'src/util/nostr'
  import Anchor from "src/partials/Anchor.svelte"
  import user from "src/agent/user"
  import {sampleRelays, getPubkeyWriteRelays} from "src/agent/relays"
  import database from "src/agent/database"
  import {routes, modal} from "src/app/ui"

  export let pubkey

  const {petnamePubkeys} = user
  const getRelays = () => sampleRelays(getPubkeyWriteRelays(pubkey))

  let following = false
  let person = database.getPersonWithFallback(pubkey)

  $: following = $petnamePubkeys.includes(pubkey)

  const follow = async () => {
    const [{url}] = getRelays()

    user.addPetname(pubkey, url, displayPerson(person))
  }

  const unfollow = async () => {
    user.removePetname(pubkey)
  }

  const share = () => {
    modal.set({type: 'person/share', person})
  }
</script>

<div class="flex flex-col gap-4 py-2 px-3 relative">
  <div class="flex gap-4">
    <div
      class="overflow-hidden w-14 h-14 rounded-full bg-cover bg-center shrink-0 border border-solid border-white"
      style="background-image: url({person.kind0?.picture})" />
    <div class="flex-grow flex flex-col gap-2">
      <Anchor
        type="unstyled"
        class="flex items-center gap-2"
        on:click={() => navigate(routes.person(pubkey))}>
        <h2 class="text-lg">{displayPerson(person)}</h2>
      </Anchor>
      {#if person.verified_as}
      <div class="flex gap-1 text-sm">
        <i class="fa fa-user-check text-accent" />
        <span class="text-light">{last(person.verified_as.split('@'))}</span>
      </div>
      {/if}
    </div>
    <div class="flex gap-2">
      <Anchor class="tippy-close" type="button-circle" on:click={share}>
        <i class="fa fa-share-nodes" />
      </Anchor>
      {#if following}
      <Anchor type="button-circle" on:click={unfollow}>
        <i class="fa fa-user-minus" />
      </Anchor>
      {:else}
      <Anchor type="button-circle" on:click={follow}>
        <i class="fa fa-user-plus" />
      </Anchor>
      {/if}
    </div>
  </div>
  <p>{@html renderContent(person?.kind0?.about || '')}</p>
</div>
