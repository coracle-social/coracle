<script lang="ts">
  import {fly} from "src/util/transition"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import {social, directory, nip05} from "src/system"
  import {getPubkeyWriteRelays, sampleRelays} from "src/agent/relays"

  export let pubkey
  export let hasPetname = null

  const profile = directory.getProfile(pubkey)
  const handle = nip05.getHandle(pubkey)

  const unfollow = async () => {
    await social.unfollow(pubkey)

    isFollowing = getIsFollowing()
  }

  const follow = async () => {
    const [{url}] = sampleRelays(getPubkeyWriteRelays(pubkey))

    await social.follow(pubkey, url, directory.displayProfile(profile))

    isFollowing = getIsFollowing()
  }

  const getIsFollowing = () => (hasPetname ? hasPetname(pubkey) : social.isUserFollowing(pubkey))

  // Set this manually to avoid a million listeners
  let isFollowing = getIsFollowing()
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
          <h1 class="text-xl">{directory.displayProfile(profile)}</h1>
          {#if handle}
            <div class="flex gap-1 text-sm">
              <i class="fa fa-user-check text-accent" />
              <span class="text-gray-1">{nip05.displayHandle(handle)}</span>
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
