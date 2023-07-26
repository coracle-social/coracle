<script lang="ts">
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import PersonHandle from "src/app/shared/PersonHandle.svelte"
  import {Keys, User} from "src/app/engine"

  export let pubkey
  export let hideActions = false

  const following = User.followsSet.derived(s => s.has(pubkey))
  const muted = User.mutesSet.derived(s => s.has(pubkey))
  const showDetail = () => modal.push({type: "person/feed", pubkey})
  const unfollow = () => User.unfollow(pubkey)
  const follow = () => User.follow(pubkey)
  const unmute = () => User.unmute(pubkey)
  const mute = () => User.mute("p", pubkey)
</script>

<div class="relative flex flex-grow flex-col gap-4 px-3 py-2">
  <Anchor on:click={showDetail} class="flex gap-4">
    <PersonCircle size={14} {pubkey} />
    <div class="flex flex-grow flex-col gap-1 pr-16">
      <PersonName class="text-lg" {pubkey} />
      <PersonHandle {pubkey} />
    </div>
  </Anchor>
  {#if !hideActions}
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
  {/if}
  <PersonAbout truncate {pubkey} />
</div>
