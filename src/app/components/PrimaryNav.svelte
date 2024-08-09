<style>
  .z-nav-active {
    -webkit-mask-image: url("/nav-active.svg");
    mask-image: url("/nav-active.svg");
  }
</style>

<script lang="ts">
  import {goto} from '$app/navigation'
  import Icon from "@lib/components/Icon.svelte"
  import PrimaryNavItem from "@lib/components/PrimaryNavItem.svelte"
  import SpaceAdd from '@app/components/SpaceAdd.svelte'
  import {makeGroupId} from "@app/domain"
  import {session} from "@app/base"
  import {userGroupRelaysByNom, groupsById, deriveProfile} from "@app/state"
  import {pushModal} from "@app/modal"

  export const addSpace = () => pushModal(SpaceAdd)

  export const browseSpaces = () => goto("/browse")

  const profile = deriveProfile($session?.pubkey)
</script>

<div class="relative w-14 bg-base-100">
  <div class="absolute -top-[44px] z-nav-active ml-2 h-[144px] w-12 bg-base-300" />
  <div class="flex h-full flex-col justify-between">
    <div>
      <PrimaryNavItem title={$profile?.name}>
        <div class="w-10 rounded-full border border-solid border-base-300">
          <img alt="" src={$profile?.picture} />
        </div>
      </PrimaryNavItem>
      {#each $userGroupRelaysByNom.entries() as [nom, relays] (nom)}
        {@const group = $groupsById.get(makeGroupId(relays[0], nom))}
        <PrimaryNavItem title={group.name}>
          <div class="w-10 rounded-full border border-solid border-base-300">
            <img alt={group.name} src={group.picture} />
          </div>
        </PrimaryNavItem>
      {/each}
      <PrimaryNavItem title="Add Space" on:click={addSpace}>
        <div class="!flex w-10 items-center justify-center">
          <Icon size={7} icon="add-circle" />
        </div>
      </PrimaryNavItem>
      <PrimaryNavItem title="Browse Spaces" on:click={browseSpaces}>
        <div class="!flex w-10 items-center justify-center">
          <Icon size={6} icon="compass-big" />
        </div>
      </PrimaryNavItem>
    </div>
    <div>
      <PrimaryNavItem title="Settings">
        <div class="!flex w-10 items-center justify-center">
          <Icon size={7} icon="settings" />
        </div>
      </PrimaryNavItem>
    </div>
  </div>
</div>
