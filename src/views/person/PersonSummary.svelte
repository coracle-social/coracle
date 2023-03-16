<script lang="ts">
  import {last} from "ramda"
  import {navigate} from "svelte-routing"
  import {renderContent} from "src/util/html"
  import {displayPerson} from "src/util/nostr"
  import Anchor from "src/partials/Anchor.svelte"
  import user from "src/agent/user"
  import {sampleRelays, getPubkeyWriteRelays} from "src/agent/relays"
  import {getPersonWithFallback} from "src/agent/tables"
  import {watch} from "src/agent/storage"
  import {routes} from "src/app/ui"
  import PersonCircle from "src/partials/PersonCircle.svelte"

  export let pubkey

  const {petnamePubkeys, canPublish} = user
  const getRelays = () => sampleRelays(getPubkeyWriteRelays(pubkey))
  const person = watch("people", () => getPersonWithFallback(pubkey))

  let following = false

  $: following = $petnamePubkeys.includes(pubkey)

  const follow = async () => {
    const [{url}] = getRelays()

    user.addPetname(pubkey, url, displayPerson($person))
  }

  const unfollow = async () => {
    user.removePetname(pubkey)
  }
</script>

<div class="relative flex flex-col gap-4 py-2 px-3">
  <div class="flex gap-4">
    <PersonCircle size={14} person={$person} />
    <div class="flex flex-grow flex-col gap-2">
      <Anchor
        type="unstyled"
        class="flex items-center gap-2"
        on:click={() => navigate(routes.person(pubkey))}>
        <h2 class="text-lg">{displayPerson($person)}</h2>
      </Anchor>
      {#if $person.verified_as}
        <div class="flex gap-1 text-sm">
          <i class="fa fa-user-check text-accent" />
          <span class="text-gray-1">{last($person.verified_as.split("@"))}</span>
        </div>
      {/if}
    </div>
    <div class="flex gap-2">
      {#if $canPublish}
        {#if following}
          <Anchor type="button-circle" on:click={unfollow}>
            <i class="fa fa-user-minus" />
          </Anchor>
        {:else}
          <Anchor type="button-circle" on:click={follow}>
            <i class="fa fa-user-plus" />
          </Anchor>
        {/if}
      {/if}
    </div>
  </div>
  <p>{@html renderContent($person?.kind0?.about || "")}</p>
</div>
