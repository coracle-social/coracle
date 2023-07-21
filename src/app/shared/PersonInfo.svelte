<script lang="ts">
  import {fly} from "src/util/transition"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import {User, Directory, Nip05} from "src/app/engine"

  export let pubkey
  export let hasPetname = null

  const profile = Directory.getProfile(pubkey)
  const handle = Nip05.getHandle(pubkey)

  const unfollow = () => {
    User.unfollow(pubkey)

    isFollowing = false
  }

  const follow = () => {
    User.follow(pubkey)

    isFollowing = true
  }

  // Set this manually to avoid a million listeners
  let isFollowing = hasPetname ? hasPetname(pubkey) : User.isFollowing(pubkey)
</script>

<div in:fly={{y: 20}}>
  <Anchor
    type="unstyled"
    on:click={() => modal.push({type: "person/feed", pubkey})}
    class="flex gap-4 overflow-hidden border-l-2 border-solid border-gray-7 py-3 pl-4
           transition-all hover:border-accent hover:bg-gray-8">
    <PersonCircle {pubkey} size={12} />
    <div class="flex min-w-0 flex-grow flex-col gap-4">
      <div class="flex items-start justify-between gap-2">
        <div class="flex flex-col gap-2">
          <h1 class="text-xl">{Directory.displayProfile(profile)}</h1>
          {#if handle}
            <div class="flex gap-1 text-sm">
              <i class="fa fa-user-check text-accent" />
              <span class="text-gray-1">{Nip05.displayHandle(handle)}</span>
            </div>
          {/if}
        </div>
        {#if isFollowing}
          <Anchor theme="button-accent" stopPropagation on:click={unfollow}>Following</Anchor>
        {:else}
          <Anchor theme="button" stopPropagation on:click={follow}>Follow</Anchor>
        {/if}
      </div>
      <p class="overflow-hidden text-ellipsis">
        <PersonAbout truncate {pubkey} />
      </p>
    </div>
  </Anchor>
</div>
