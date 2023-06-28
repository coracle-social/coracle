<script lang="ts">
  import {last, nth} from "ramda"
  import {displayPerson} from "src/util/nostr"
  import Anchor from "src/partials/Anchor.svelte"
  import {keys, social} from "src/system"
  import user from "src/agent/user"
  import {sampleRelays, getPubkeyWriteRelays} from "src/agent/relays"
  import {getPersonWithFallback} from "src/agent/db"
  import {watch} from "src/agent/db"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import {routes} from "src/app/state"

  export let pubkey

  const {canSign} = keys
  const {petnamePubkeys, mutes} = user
  const getRelays = () => sampleRelays(getPubkeyWriteRelays(pubkey))
  const person = watch("people", () => getPersonWithFallback(pubkey))

  $: following = $petnamePubkeys.includes(pubkey)
  $: muted = $mutes.map(nth(1)).includes(pubkey)

  const follow = () => {
    const [{url}] = getRelays()

    social.follow(pubkey, url, displayPerson($person))
  }

  const unfollow = () => social.unfollow(pubkey)

  const unmute = () => user.removeMute(pubkey)

  const mute = () => user.addMute("p", pubkey)
</script>

<div class="relative flex flex-col gap-4 px-3 py-2">
  <div class="flex justify-between gap-2">
    <Anchor href={routes.person($person.pubkey)} class="flex gap-4">
      <PersonCircle size={14} person={$person} />
      <div class="flex flex-grow flex-col gap-2">
        <h2 class="text-lg">{displayPerson($person)}</h2>
        {#if $person.verified_as}
          <div class="flex gap-1 text-sm">
            <i class="fa fa-user-check text-accent" />
            <span class="opacity-75">{last($person.verified_as.split("@"))}</span>
          </div>
        {/if}
      </div>
    </Anchor>
    <div class="flex gap-4 py-2 text-lg">
      {#if $canSign}
        {#if muted}
          <i
            title="Unmute"
            class="fa fa-microphone-slash w-6 cursor-pointer text-center"
            on:click={unmute} />
        {:else}
          <i title="Mute" class="fa fa-microphone w-6 cursor-pointer text-center" on:click={mute} />
        {/if}
        {#if following}
          <i
            title="Unfollow"
            class="fa fa-user-minus w-6 cursor-pointer text-center"
            on:click={unfollow} />
        {:else}
          <i
            title="Follow"
            class="fa fa-user-plus w-6 cursor-pointer text-center"
            on:click={follow} />
        {/if}
      {/if}
    </div>
  </div>
  <PersonAbout person={$person} />
</div>
