<script lang="ts">
  import {defaultTo} from "ramda"
  import Anchor from "src/partials/Anchor.svelte"
  import {directory, nip02, nip05} from "src/app/engine"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import {Keys, User} from "src/app/engine"
  import {routes} from "src/app/state"

  export let pubkey

  const graphEntry = nip02.graph.key(keyS.pubkey.get())
  const following = graphEntry.derived(() => User.isFollowing(pubkey))
  const muted = graphEntry.derived(() => User.isIgnoring(pubkey))
  const profile = directory.profiles.key(pubkey).derived(defaultTo({pubkey}))
  const handle = nip05.handles.key(pubkey)
  const unfollow = () => User.unfollow(pubkey)
  const follow = () => User.follow(pubkey)
  const unmute = () => User.unmute(pubkey)
  const mute = () => User.mute("p", pubkey)
</script>

<div class="relative flex flex-col gap-4 px-3 py-2">
  <Anchor href={routes.person(pubkey)} class="flex gap-4">
    <PersonCircle size={14} {pubkey} />
    <div class="flex flex-grow flex-col gap-2">
      <h2 class="pr-16 text-lg">{directory.displayProfile($profile)}</h2>
      {#if $handle}
        <div class="flex gap-1 text-sm">
          <i class="fa fa-user-check text-accent" />
          <span class="opacity-75">{nip05.displayHandle($handle)}</span>
        </div>
      {/if}
    </div>
  </Anchor>
  <div class="absolute right-1 top-1 flex gap-4 py-2 text-lg">
    {#if Keys.canSign.get()}
      {#if $muted}
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
  <PersonAbout {pubkey} />
</div>
