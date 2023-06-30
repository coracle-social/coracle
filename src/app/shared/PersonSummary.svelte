<script lang="ts">
  import {nth} from "ramda"
  import Anchor from "src/partials/Anchor.svelte"
  import {keys, directory, social, nip05} from "src/system"
  import user from "src/agent/user"
  import {sampleRelays, getPubkeyWriteRelays} from "src/agent/relays"
  import {watch} from "src/agent/db"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import {routes} from "src/app/state"

  export let pubkey

  const {canSign} = keys
  const following = watch(social.graph, () => social.isUserFollowing(pubkey))
  const {mutes} = user
  const getRelays = () => sampleRelays(getPubkeyWriteRelays(pubkey))
  const profile = watch(directory.profiles, () => directory.getProfile(pubkey))
  const handle = watch(nip05.handles, () => nip05.getHandle(pubkey))

  $: muted = $mutes.map(nth(1)).includes(pubkey)

  const follow = () => {
    const [{url}] = getRelays()

    social.follow(pubkey, url, directory.displayPubkey(pubkey))
  }

  const unfollow = () => social.unfollow(pubkey)

  const unmute = () => user.removeMute(pubkey)

  const mute = () => user.addMute("p", pubkey)
</script>

<div class="relative flex flex-col gap-4 px-3 py-2">
  <div class="flex justify-between gap-2">
    <Anchor href={routes.person(pubkey)} class="flex gap-4">
      <PersonCircle size={14} {pubkey} />
      <div class="flex flex-grow flex-col gap-2">
        <h2 class="text-lg">{directory.displayProfile($profile)}</h2>
        {#if $handle}
          <div class="flex gap-1 text-sm">
            <i class="fa fa-user-check text-accent" />
            <span class="opacity-75">{nip05.displayHandle($handle)}</span>
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
        {#if $following}
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
  <PersonAbout {pubkey} />
</div>
