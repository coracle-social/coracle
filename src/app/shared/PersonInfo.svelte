<script lang="ts">
  import {last} from "ramda"
  import {fly} from "src/util/transition"
  import {displayPerson} from "src/util/nostr"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import {social} from "src/system"
  import {getPubkeyWriteRelays, sampleRelays} from "src/agent/relays"

  export let person
  export let hasPetname = null

  const unfollow = async ({pubkey}) => {
    await social.unfollow(pubkey)

    isFollowing = getIsFollowing()
  }

  const follow = async ({pubkey}) => {
    const [{url}] = sampleRelays(getPubkeyWriteRelays(pubkey))

    await social.follow(pubkey, url, displayPerson(person))

    isFollowing = getIsFollowing()
  }

  const getIsFollowing = () =>
    hasPetname ? hasPetname(person.pubkey) : social.isUserFollowing(person.pubkey)

  // Set this manually to avoid a million listeners
  let isFollowing = getIsFollowing()
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
        {#if isFollowing}
          <Anchor theme="button-accent" stopPropagation on:click={() => unfollow(person)}>
            Following
          </Anchor>
        {:else}
          <Anchor theme="button" stopPropagation on:click={() => follow(person)}>Follow</Anchor>
        {/if}
      </div>
      <p class="overflow-hidden text-ellipsis">
        <PersonAbout truncate {person} />
      </p>
    </div>
  </Anchor>
</div>
